import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function findUserByUsername(username) {
  const [rows] = await db.query(
    `SELECT id, username FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1`,
    [username]
  );
  return rows[0] || null;
}

export const searchForUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const searchTerm = `%${q.trim()}%`;
    const [rows] = await db.query(
      `SELECT id, username
       FROM users
       WHERE username LIKE ?
       ORDER BY username ASC
       LIMIT 10`,
      [searchTerm]
    );

    const users = rows.map((u) => ({ value: u.username, label: u.username }));
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search for users" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId, message, messageType = "text" } = req.body;

    if (!recipientId || !message) {
      return res
        .status(400)
        .json({ error: "Recipient and message are required" });
    }

    // Find existing 1:1 conversation between these users
    const [conversation] = await db.query(
      `SELECT c.id
       FROM conversations c
       WHERE c.is_group = 0
         AND c.id IN (
           SELECT cp1.conversation_id
           FROM conversation_participants cp1
           JOIN conversation_participants cp2
             ON cp1.conversation_id = cp2.conversation_id
           WHERE cp1.user_id = ?
             AND cp2.user_id = ?
             AND cp1.left_at IS NULL
             AND cp2.left_at IS NULL
         )
       LIMIT 1`,
      [senderId, recipientId]
    );

    let conversationId;
    if (!conversation.length) {
      // Create new conversation (include created_by)
      const [result] = await db.query(
        `INSERT INTO conversations (is_group, created_by, created_at) VALUES (0, ?, UTC_TIMESTAMP())`,
        [senderId]
      );
      conversationId = result.insertId;

      // Add participants (explicitly set left_at = NULL)
      const participantRows = [
        [conversationId, senderId, null],
        [conversationId, recipientId, null],
      ];
      const placeholders = participantRows.map(() => "(?, ?, ?)").join(",");
      const params = participantRows.flat();

      await db.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, left_at) VALUES ${placeholders}`,
        params
      );
    } else {
      conversationId = conversation[0].id;
    }

    const [msgResult] = await db.query(
      `INSERT INTO messages
            (conversation_id, sender_id, ciphertext, nonce, message_type, created_at)
            VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [conversationId, senderId, message, null, messageType]
    );

    res.status(201).json({
      success: true,
      message: "Message sent",
      messageId: msgResult.insertId,
      conversationId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// For text messages ONLY
export const editMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Get the message and verify ownership
    const [rows] = await db.query(
      `SELECT m.*, c.is_group
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE m.id = ?`,
      [messageId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Message not found" });
    }

    const msg = rows[0];

    if (msg.sender_id !== userId) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }
    if (msg.message_type !== "text") {
      return res.status(400).json({ error: "Only text messages can be edited" });
    }

    // Update the message
    await db.query(
      `UPDATE messages
       SET ciphertext = ?, edited_at = UTC_TIMESTAMP()
       WHERE id = ?`,
      [message.trim(), messageId]
    );

    return res.status(200).json({
      success: true,
      message: "Message edited successfully",
      messageId: parseInt(messageId),
    });
  } catch (err) {
    console.error("Error editing message:", err);
    return res.status(500).json({ error: "Failed to edit message" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    // Get the message and verify ownership
    const [rows] = await db.query(
      `SELECT m.*, c.is_group
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE m.id = ?`,
      [messageId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Message not found" });
    }

    const msg = rows[0];

    if (msg.sender_id !== userId) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    // If it's an image, delete the file from disk
    if (msg.message_type === "image") {
      try {
        let imagePath = msg.ciphertext;

        if (Buffer.isBuffer(imagePath)) {
          imagePath = imagePath.toString("utf8");
        }

        const fullPath = path.join(__dirname, "..", imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (fileErr) {
        console.error("Error deleting image file:", fileErr);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Finally delete the message from database
    await db.query(`DELETE FROM messages WHERE id = ?`, [messageId]);

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      messageId: parseInt(messageId),
    });
  } catch (err) {
    console.error("Error deleting message:", err);
    return res.status(500).json({ error: "Failed to delete message" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch conversations with last message, participant info, AND profile pictures
    const [conversations] = await db.query(
      `SELECT
         c.id,
         c.is_group,
         c.group_name,
         c.created_at,
         c.updated_at,
         -- last message info (aggregate to satisfy ONLY_FULL_GROUP_BY)
         MAX(dm.ciphertext) AS last_message,
         MAX(dm.created_at) AS last_message_time,
         MAX(dm.sender_id) AS last_message_sender_id,
         -- participant lists
         GROUP_CONCAT(DISTINCT cp.user_id ORDER BY cp.user_id) AS participant_ids,
         GROUP_CONCAT(DISTINCT u.username ORDER BY cp.user_id SEPARATOR ',') AS participant_usernames,
         -- for 1:1 convos, fetch other user's username AND profile picture
         (CASE WHEN c.is_group = 0 THEN (
            SELECT u2.username
            FROM conversation_participants cp2
            JOIN users u2 ON u2.id = cp2.user_id
            WHERE cp2.conversation_id = c.id
              AND cp2.user_id != ?
              AND cp2.left_at IS NULL
            LIMIT 1
          ) ELSE NULL END) AS other_user_username,
         (CASE WHEN c.is_group = 0 THEN (
            SELECT u2.profile_picture
            FROM conversation_participants cp2
            JOIN users u2 ON u2.id = cp2.user_id
            WHERE cp2.conversation_id = c.id
              AND cp2.user_id != ?
              AND cp2.left_at IS NULL
            LIMIT 1
          ) ELSE NULL END) AS other_user_profile_picture
       FROM conversations c
       INNER JOIN conversation_participants cp
         ON c.id = cp.conversation_id AND cp.left_at IS NULL
       LEFT JOIN users u ON u.id = cp.user_id
       LEFT JOIN (
         SELECT m1.*
         FROM messages m1
         INNER JOIN (
           SELECT conversation_id, MAX(created_at) AS max_created
           FROM messages
           GROUP BY conversation_id
         ) m2 ON m1.conversation_id = m2.conversation_id AND m1.created_at = m2.max_created
       ) dm ON dm.conversation_id = c.id
       WHERE cp.user_id = ? AND cp.left_at IS NULL
       GROUP BY c.id
       ORDER BY last_message_time DESC, c.updated_at DESC`,
      [userId, userId, userId]
    );

    const normalizedConversations = conversations.map((c) => {
      const participantIds = c.participant_ids
        ? c.participant_ids.split(",").map(Number)
        : [];
      const participantUsernames = c.participant_usernames
        ? c.participant_usernames.split(",")
        : [];

      let displayName;
      let otherUserUsername = c.other_user_username || null;
      let profilePicture = null;

      if (c.is_group) {
        displayName = c.group_name || "Unnamed Group";
        // Groups don't have a single profile picture
      } else {
        // Use other_user_username and profile picture if available
        if (otherUserUsername) {
          displayName = otherUserUsername;
          profilePicture = c.other_user_profile_picture || null;
        } else {
          const otherIndex = participantIds.findIndex((id) => id !== userId);
          displayName = participantUsernames[otherIndex] || "Unknown User";
          otherUserUsername = participantUsernames[otherIndex] || null;
        }
      }

      // TODO: Maybe simplify?
      return {
        id: c.id,
        is_group: Boolean(c.is_group),
        group_name: c.group_name || null,
        participant_ids: participantIds,
        participant_usernames: participantUsernames,
        display_name: displayName,
        other_user_username: otherUserUsername,
        profile_picture: profilePicture,
        last_message: c.last_message || null,
        last_message_time: c.last_message_time
          ? new Date(c.last_message_time).toISOString()
          : null,
        last_message_sender_id: c.last_message_sender_id || null,
        created_at: c.created_at ? new Date(c.created_at).toISOString() : null,
        updated_at: c.updated_at ? new Date(c.updated_at).toISOString() : null,
      };
    });

    res.json({ conversations: normalizedConversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get conversation list" });
  }
};

// TODO: Maybe
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Get the message and conversation info
    const [message] = await db.query(
      `SELECT m.*, c.is_group
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE m.id = ?`,
      [messageId]
    );

    if (!message.length) {
      return res.status(404).json({ error: "Message not found" });
    }

    const msg = message[0];
    const isGroup = Boolean(msg.is_group);
    const conversationId = msg.conversation_id;

    // Don't mark your own messages as read
    if (msg.sender_id === userId) {
      return res.status(400).json({ error: "Cannot mark your own message as read" });
    }

    const [participant] = await db.query(
      `SELECT * FROM conversation_participants
       WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL`,
      [conversationId, userId]
    );

    if (!participant.length) {
      return res.status(403).json({ error: "Not a participant in this conversation" });
    }

    if (isGroup) {
      // For group chats: update read position (will create if doesn't exist)
      await db.query(
        `INSERT INTO conversation_read_positions (conversation_id, user_id, last_read_message_id, updated_at)
         VALUES (?, ?, ?, UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE
           last_read_message_id = GREATEST(last_read_message_id, ?),
           updated_at = UTC_TIMESTAMP()`,
        [conversationId, userId, messageId, messageId]
      );
    } else {
      // For 1:1 chats: use the messages.read_at column directly
      await db.query(
        `UPDATE messages
         SET read_at = UTC_TIMESTAMP()
         WHERE id = ? AND read_at IS NULL`,
        [messageId]
      );
    }

    return res.status(200).json({ success: true, messageId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to mark message as read" });
  }
};

export const startConversationByUsername = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { username } = req.body;

    if (!username)
      return res.status(400).json({ error: "username is required" });

    const other = await findUserByUsername(username);
    if (!other) return res.status(404).json({ error: "User not found" });
    if (other.id === currentUserId)
      return res
        .status(400)
        .json({ error: "Cannot start conversation with yourself" });

    // Check if a 1:1 conversation already exists between these two users
    const [existing] = await db.query(
      `SELECT c.*
       FROM conversations c
       WHERE c.is_group = 0
         AND c.id IN (
           SELECT cp1.conversation_id
           FROM conversation_participants cp1
           JOIN conversation_participants cp2
             ON cp1.conversation_id = cp2.conversation_id
           WHERE cp1.user_id = ?
             AND cp2.user_id = ?
             AND cp1.left_at IS NULL
             AND cp2.left_at IS NULL
         )
       LIMIT 1`,
      [currentUserId, other.id]
    );

    let conversationId;

    if (existing.length > 0) {
      // Conversation already exists
      conversationId = existing[0].id;

      return res.json({
        ...existing[0],
        other_user_username: other.username,
        display_name: other.username,
        is_group: false,
      });
    }

    // Create new 1:1 conversation (include created_by)
    const [result] = await db.query(
      `INSERT INTO conversations (is_group, created_by, created_at)
       VALUES (0, ?, UTC_TIMESTAMP())`,
      [currentUserId]
    );

    conversationId = result.insertId;

    // Add both participants (explicitly set left_at = NULL)
    const participantRows = [
      [conversationId, currentUserId, null],
      [conversationId, other.id, null],
    ];
    const placeholders = participantRows.map(() => "(?, ?, ?)").join(",");
    const params = participantRows.flat();

    await db.query(
      `INSERT INTO conversation_participants (conversation_id, user_id, left_at) VALUES ${placeholders}`,
      params
    );

    // Get the created conversation
    const [rows] = await db.query(`SELECT * FROM conversations WHERE id = ?`, [conversationId]);

    return res.status(201).json({
      ...rows[0],
      other_user_username: other.username,
      display_name: other.username,
      is_group: false,
    });
  } catch (err) {
    console.error("Error in startConversationByUsername:", err);
    return res
      .status(500)
      .json({ error: "Failed to start conversation for other user" });
  }
};

export const sendMessageToUsername = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientUsername, message, messageType = "text" } = req.body;

    if (!recipientUsername || !message) {
      return res
        .status(400)
        .json({ error: "recipientUsername and message are required" });
    }

    const recipient = await findUserByUsername(recipientUsername);
    if (!recipient)
      return res.status(404).json({ error: "Recipient not found" });
    if (recipient.id === senderId)
      return res.status(400).json({ error: "Cannot message yourself" });

    // Find existing 1:1 conversation
    const [rows] = await db.query(
      `SELECT c.id
       FROM conversations c
       WHERE c.is_group = 0
         AND c.id IN (
           SELECT cp1.conversation_id
           FROM conversation_participants cp1
           JOIN conversation_participants cp2
             ON cp1.conversation_id = cp2.conversation_id
           WHERE cp1.user_id = ?
             AND cp2.user_id = ?
             AND cp1.left_at IS NULL
             AND cp2.left_at IS NULL
         )
       LIMIT 1`,
      [senderId, recipient.id]
    );

    let conversationId;
    if (!rows.length) {
      // Create new conversation (include created_by)
      const [result] = await db.query(
        `INSERT INTO conversations (is_group, created_by, created_at) VALUES (0, ?, UTC_TIMESTAMP())`,
        [senderId]
      );
      conversationId = result.insertId;

      // Add participants (explicitly set left_at = NULL)
      const participantRows = [
        [conversationId, senderId, null],
        [conversationId, recipient.id, null],
      ];
      const placeholders = participantRows.map(() => "(?, ?, ?)").join(",");
      const params = participantRows.flat();

      await db.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, left_at) VALUES ${placeholders}`,
        params
      );
    } else {
      conversationId = rows[0].id;
    }

    const [msgResult] = await db.query(
      `INSERT INTO messages
        (conversation_id, sender_id, ciphertext, nonce, message_type, created_at)
        VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [conversationId, senderId, message, null, messageType]
    );

    return res.status(201).json({
      success: true,
      message: "Message sent",
      messageId: msgResult.insertId,
      conversationId,
    });
  } catch (err) {
    console.error("Error in sendMessageToUsername:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to send message to user" });
  }
};

// TODO: Might have to fix for pagination purposes
export async function getMessagesByConversationId(req, res) {
    try {
        const userId = req.user.id;
        const conversationId = req.params.conversationId;

        // Verify user is a participant
        const [participant] = await db.query(
            `SELECT 1 FROM conversation_participants 
             WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL`,
            [conversationId, userId]
        );

        if (!participant.length) {
            return res.status(403).json({ error: "Not a participant in this conversation" });
        }

        const before = req.query.before ? parseInt(req.query.before) : null;
        let limit = parseInt(req.query.limit) || 20;
        limit = Math.min(limit, 100); // safety cap

        let query;
        let params;

        if (before) {
            // Load OLDER messages (pagination backwards)
            // Get messages with ID less than 'before', ordered DESC, then reverse in app
            query = `
                SELECT m.*, 
                       u.username as sender_username, 
                       u.profile_picture as sender_profile_picture
                FROM messages m
                JOIN users u ON u.id = m.sender_id
                WHERE m.conversation_id = ?
                  AND m.id < ?
                ORDER BY m.id DESC
                LIMIT ?
            `;
            params = [conversationId, before, limit];
        } else {
            // Initial load: get the LATEST messages
            query = `
                SELECT m.*, 
                       u.username as sender_username, 
                       u.profile_picture as sender_profile_picture
                FROM messages m
                JOIN users u ON u.id = m.sender_id
                WHERE m.conversation_id = ?
                ORDER BY m.id DESC
                LIMIT ?
            `;
            params = [conversationId, limit];
        }

        const [rows] = await db.query(query, params);

        // Reverse to get chronological order (oldest to newest)
        const messages = rows.reverse();

        // Check if there are more older messages
        let hasMore = false;
        if (messages.length > 0) {
            const oldestId = messages[0].id;
            const [olderCheck] = await db.query(
                `SELECT 1 FROM messages 
                 WHERE conversation_id = ? AND id < ? 
                 LIMIT 1`,
                [conversationId, oldestId]
            );
            hasMore = olderCheck.length > 0;
        }

        return res.json({
            messages: messages,
            hasMore: hasMore
        });

    } catch (err) {
        console.error("Error in getMessagesByConversationId:", err);
        return res.status(500).json({ error: "Failed to load messages" });
    }
}

export const getMessagesWithUsername = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUsername = req.params.username;

    const other = await findUserByUsername(otherUsername);
    if (!other) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find 1:1 conversation between these users
    const [conversation] = await db.query(
      `SELECT c.id
       FROM conversations c
       WHERE c.is_group = 0
         AND c.id IN (
           SELECT cp1.conversation_id
           FROM conversation_participants cp1
           JOIN conversation_participants cp2
             ON cp1.conversation_id = cp2.conversation_id
           WHERE cp1.user_id = ?
             AND cp2.user_id = ?
             AND cp1.left_at IS NULL
             AND cp2.left_at IS NULL
         )
       LIMIT 1`,
      [currentUserId, other.id]
    );

    if (!conversation.length) {
      return res.json({ conversationId: null, messages: [] });
    }

    const conversationId = conversation[0].id;

    const [messages] = await db.query(
      `SELECT dm.*, u.username as sender_username
        FROM messages dm
        JOIN users u ON dm.sender_id = u.id
        WHERE dm.conversation_id = ?
        ORDER BY dm.created_at ASC`,
      [conversationId]
    );

    const normalized = messages.map((m) => ({
      ...m,
      created_at: m.created_at ? new Date(m.created_at).toISOString() : null,
      read_at: m.read_at ? new Date(m.read_at).toISOString() : null,
    }));

    return res.json({ conversationId, messages: normalized });
  } catch (err) {
    console.error("Error in getMessagesWithUsername:", err);
    return res
      .status(500)
      .json({ error: "Failed to get messages from other user" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const convId = req.params.id;
    const userId = req.user.id;

    const [participant] = await db.execute(
      "SELECT * FROM conversation_participants WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL",
      [convId, userId]
    );

    if (!participant.length) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this conversation" });
    }

    const [imageMessages] = await db.execute(
      "SELECT ciphertext FROM messages WHERE conversation_id = ? AND message_type = 'image'",
      [convId]
    );

    let deletedImagesCount = 0;
    for (const msg of imageMessages) {
      try {
        let imagePath = msg.ciphertext;
        if (Buffer.isBuffer(imagePath)) {
          imagePath = imagePath.toString("utf8");
        }

        const fullPath = path.join(__dirname, "..", imagePath);

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          deletedImagesCount++;
        }
      } catch (err) {
        console.error(`Error deleting image file:`, err);
      }
    }

    // Delete read positions (foreign key constraint)
    await db.execute("DELETE FROM conversation_read_positions WHERE conversation_id = ?", [convId]);
    await db.execute("DELETE FROM messages WHERE conversation_id = ?", [convId]);
    await db.execute("DELETE FROM conversation_participants WHERE conversation_id = ?", [convId]);
    await db.execute("DELETE FROM conversations WHERE id = ?", [convId]);

    res.json({
      message: "Conversation deleted successfully",
      imagesDeleted: deletedImagesCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete conversation" });
  }
};

export const sendImageToUsername = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientUsername } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    if (!recipientUsername) {
      return res.status(400).json({ error: "recipientUsername is required" });
    }

    const recipient = await findUserByUsername(recipientUsername);
    if (!recipient)
      return res.status(404).json({ error: "Recipient not found" });
    if (recipient.id === senderId)
      return res.status(400).json({ error: "Cannot message yourself" });

    // Find existing 1:1 conversation
    const [rows] = await db.query(
      `SELECT c.id
       FROM conversations c
       WHERE c.is_group = 0
         AND c.id IN (
           SELECT cp1.conversation_id 
           FROM conversation_participants cp1
           JOIN conversation_participants cp2 
             ON cp1.conversation_id = cp2.conversation_id
           WHERE cp1.user_id = ? 
             AND cp2.user_id = ?
             AND cp1.left_at IS NULL 
             AND cp2.left_at IS NULL
         )
       LIMIT 1`,
      [senderId, recipient.id]
    );

    let conversationId;
    if (!rows.length) {
      // Create new conversation if we don't have one already
      const [result] = await db.query(
        `INSERT INTO conversations (is_group, created_by, created_at) VALUES (0, ?, UTC_TIMESTAMP())`,
        [senderId]
      );
      conversationId = result.insertId;

      // Add participants
      const participantRows = [
        [conversationId, senderId, null],
        [conversationId, recipient.id, null],
      ];
      const placeholders = participantRows.map(() => "(?, ?, ?)").join(",");
      const params = participantRows.flat();

      await db.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, left_at) VALUES ${placeholders}`,
        params
      );
    } else {
      conversationId = rows[0].id;
    }

    const imageUrl = `/uploads/images/${req.file.filename}`;

    const [msgResult] = await db.query(
      `INSERT INTO messages
        (conversation_id, sender_id, ciphertext, nonce, message_type, created_at)
        VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [conversationId, senderId, imageUrl, null, "image"]
    );

    return res.status(201).json({
      success: true,
      message: "Image sent",
      messageId: msgResult.insertId,
      conversationId,
      imageUrl: imageUrl,
    });
  } catch (err) {
    console.error("Error in sendImageToUsername:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to send image to user" });
  }
};

// GROUP CHAT FUNCTIONS

export const createGroupChat = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { groupName, participantUsernames } = req.body;

    if (
      !groupName ||
      !participantUsernames ||
      !Array.isArray(participantUsernames)
    ) {
      return res.status(400).json({
        error: "groupName and participantUsernames array are required",
      });
    }

    if (participantUsernames.length < 2) {
      return res.status(400).json({
        error: "Group must have at least 2 participants (excluding creator)",
      });
    }

    const cleanedUsernames = participantUsernames
      .map((u) => (typeof u === "string" ? u.trim().toLowerCase() : null))
      .filter(Boolean);

    if (cleanedUsernames.includes("")) {
      return res
        .status(400)
        .json({ error: "Invalid username in participants" });
    }

    const participantIds = [];
    for (const username of cleanedUsernames) {
      const [rows] = await db.query(
        "SELECT id FROM users WHERE LOWER(username) = ? LIMIT 1",
        [username]
      );
      if (!rows.length) {
        return res.status(404).json({ error: `User not found: ${username}` });
      }
      const userId = rows[0].id;
      if (userId === creatorId) continue;
      participantIds.push(userId);
    }

    const [result] = await db.query(
      `INSERT INTO conversations (is_group, group_name, created_by, created_at) 
       VALUES (?, ?, ?, UTC_TIMESTAMP())`,
      [true, groupName.trim(), creatorId]
    );

    const conversationId = result.insertId;

    const allParticipants = [creatorId, ...participantIds];
    if (allParticipants.length) {
      const values = allParticipants
        .map((id) => `(${conversationId}, ${id}, NULL)`)
        .join(",");
      await db.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, left_at) VALUES ${values}`
      );
    }

    const [conversationRows] = await db.query(
      `SELECT c.*, GROUP_CONCAT(u.username) as participant_usernames
       FROM conversations c
       LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
       LEFT JOIN users u ON u.id = cp.user_id
       WHERE c.id = ?
       GROUP BY c.id`,
      [conversationId]
    );

    return res.status(201).json({
      success: true,
      conversation: conversationRows[0],
    });
  } catch (err) {
    console.error("Error creating group chat:", err);
    return res.status(500).json({ error: "Failed to create group chat" });
  }
};

export const sendMessageToGroup = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { conversationId, message, messageType = "text" } = req.body;

    if (!conversationId || !message) {
      return res
        .status(400)
        .json({ error: "conversationId and message are required" });
    }

    const [participant] = await db.query(
      `SELECT c.is_group FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE c.id = ? AND cp.user_id = ? AND cp.left_at IS NULL`,
      [conversationId, senderId]
    );

    if (!participant.length) {
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    if (!participant[0].is_group) {
      return res
        .status(400)
        .json({ error: "This is not a group conversation" });
    }

    const [msgResult] = await db.query(
      `INSERT INTO messages
        (conversation_id, sender_id, ciphertext, nonce, message_type, created_at)
        VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [conversationId, senderId, message, null, messageType]
    );

    return res.status(201).json({
      success: true,
      message: "Message sent to group",
      messageId: msgResult.insertId,
      conversationId,
    });
  } catch (err) {
    console.error("Error sending group message:", err);
    return res.status(500).json({ error: "Failed to send message to group" });
  }
};

export const addParticipantsToGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.conversationId;
    const { usernames } = req.body;

    // Validate incoming usernames
    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({ error: "usernames array is required" });
    }

    // Check that the requester is part of the group & that it's a group chat
    const [rows] = await db.query(
      `SELECT c.is_group 
       FROM conversations c
       JOIN conversation_participants cp 
            ON c.id = cp.conversation_id
       WHERE c.id = ? 
         AND cp.user_id = ? 
         AND cp.left_at IS NULL`,
      [conversationId, userId]
    );

    if (!rows.length || !rows[0].is_group) {
      return res
        .status(403)
        .json({ error: "Not authorized to add participants" });
    }

    // Convert usernames → user IDs
    const userIds = [];
    for (const username of usernames) {
      const user = await findUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: `User not found: ${username}` });
      }
      userIds.push(user.id);
    }

    if (userIds.length) {
      // Build placeholders and params to insert multiple rows safely
      const participantRows = userIds.map((id) => [conversationId, id, null]);
      const placeholders = participantRows.map(() => "(?, ?, ?)").join(",");
      const params = participantRows.flat();

      await db.query(
        `INSERT IGNORE INTO conversation_participants (conversation_id, user_id, left_at) VALUES ${placeholders}`,
        params
      );
    }

    return res.json({ success: true, message: "Participants added" });
  } catch (err) {
    console.error("Error adding participants:", err);
    return res.status(500).json({ error: "Failed to add participants" });
  }
};

export const sendImageToGroup = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { conversationId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required" });
    }

    // Verify user is a participant and it's a group
    const [participant] = await db.query(
      `SELECT c.is_group FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE c.id = ? AND cp.user_id = ? AND cp.left_at IS NULL`,
      [conversationId, senderId]
    );

    if (!participant.length) {
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    if (!participant[0].is_group) {
      return res
        .status(400)
        .json({ error: "This is not a group conversation" });
    }

    const imageUrl = `/uploads/images/${req.file.filename}`;

    const [msgResult] = await db.query(
      `INSERT INTO messages
        (conversation_id, sender_id, ciphertext, nonce, message_type, created_at)
        VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [conversationId, senderId, imageUrl, null, "image"]
    );

    return res.status(201).json({
      success: true,
      message: "Image sent to group",
      messageId: msgResult.insertId,
      conversationId,
      imageUrl: imageUrl,
    });
  } catch (err) {
    console.error("Error in sendImageToGroup:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to send image to group" });
  }
};

export const removeParticipantFromGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, username } = req.params;

    const [participant] = await db.query(
      `SELECT c.is_group FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE c.id = ? AND cp.user_id = ? AND cp.left_at IS NULL`,
      [conversationId, userId]
    );

    if (!participant.length || !participant[0].is_group) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const userToRemove = await findUserByUsername(username);
    if (!userToRemove) {
      return res.status(404).json({ error: "User not found" });
    }

    await db.query(
      `UPDATE conversation_participants
       SET left_at = UTC_TIMESTAMP()
       WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, userToRemove.id]
    );

    return res.json({ success: true, message: "Participant removed" });
  } catch (err) {
    console.error("Error removing participant:", err);
    return res.status(500).json({ error: "Failed to remove participant" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.conversationId;

    const [participant] = await db.query(
      `SELECT * FROM conversation_participants 
       WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL`,
      [conversationId, userId]
    );

    if (!participant.length) {
      return res.status(404).json({ error: "You are not in this group" });
    }

    await db.query(
      `UPDATE conversation_participants
       SET left_at = UTC_TIMESTAMP()
       WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, userId]
    );

    return res.json({ success: true, message: "Left group" });
  } catch (err) {
    console.error("Error leaving group:", err);
    return res.status(500).json({ error: "Failed to leave group" });
  }
};

export const updateGroupName = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.conversationId;
    const { groupName } = req.body;

    if (!groupName) {
      return res.status(400).json({ error: "groupName is required" });
    }

    const [participant] = await db.query(
      `SELECT c.is_group FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE c.id = ? AND cp.user_id = ? AND cp.left_at IS NULL`,
      [conversationId, userId]
    );

    if (!participant.length || !participant[0].is_group) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await db.query(`UPDATE conversations SET group_name = ? WHERE id = ?`, [
      groupName,
      conversationId,
    ]);

    return res.json({ success: true, message: "Group name updated" });
  } catch (err) {
    console.error("Error updating group name:", err);
    return res.status(500).json({ error: "Failed to update group name" });
  }
};