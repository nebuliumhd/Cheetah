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
       FROM railway.users 
       WHERE username LIKE ? 
       ORDER BY username ASC 
       LIMIT 10`,
      [searchTerm]
    );

    // Format for react-select (DO NOT CHANGE!!!)
    const users = rows.map((u) => ({ value: u.username, label: u.username }));

    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to search for users" });
  }
};

// Send message to another user by userId
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId, message, messageType = "text" } = req.body;

    if (!recipientId || !message) {
      return res
        .status(400)
        .json({ error: "Recipient and message are required" });
    }

    const [conversation] = await db.query(
      `SELECT *
        FROM conversations
        WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)
        LIMIT 1`,
      [senderId, recipientId, recipientId, senderId]
    );

    let conversationId;
    if (!conversation.length) {
      const [result] = await db.query(
        `INSERT INTO conversations (user_a, user_b, created_at) VALUES (?, ?, UTC_TIMESTAMP())`,
        [senderId, recipientId]
      );
      conversationId = result.insertId;
    } else {
      conversationId = conversation[0].id;
    }

    const [msgResult] = await db.query(
      `INSERT INTO direct_messages
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

// Get all conversations for logged-in user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const [conversations] = await db.query(
      `SELECT c.*,
            IF(c.user_a = ?, c.user_b, c.user_a) AS other_user_id,
              u.username AS other_user_username,
              dm.ciphertext AS last_message,
              dm.created_at AS last_message_time
             FROM conversations c
             LEFT JOIN direct_messages dm ON dm.id = (
                 SELECT id FROM direct_messages 
                 WHERE conversation_id = c.id 
                 ORDER BY created_at DESC LIMIT 1
             )
             JOIN users u ON u.id = IF(c.user_a = ?, c.user_b, c.user_a)
             WHERE c.user_a = ? OR c.user_b = ?
             ORDER BY last_message_time DESC`,
      [userId, userId, userId, userId]
    );

    res.json({ conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get conversation list" });
  }
};

// Mark a single message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Verify the message is sent TO the current user (not sent BY them)
    const [message] = await db.query(
      `SELECT dm.*, c.user_a, c.user_b 
        FROM direct_messages dm
        JOIN conversations c ON dm.conversation_id = c.id
        WHERE dm.id = ? AND dm.sender_id != ?`,
      [messageId, userId]
    );

    if (!message.length) {
      return res
        .status(404)
        .json({ error: "Message not found or already read" });
    }

    // Mark as read using UTC timestamp
    await db.query(
      `UPDATE direct_messages 
        SET read_at = UTC_TIMESTAMP() 
        WHERE id = ? AND read_at IS NULL`,
      [messageId]
    );

    return res.status(200).json({ success: true, messageId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to mark a message as read" });
  }
};

// Start a conversation by username
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

    const [existing] = await db.query(
      `SELECT * FROM conversations
        WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)
        LIMIT 1`,
      [currentUserId, other.id, other.id, currentUserId]
    );

    if (existing.length > 0) {
      const conv = existing[0];
      const [userRow] = await db.query(
        `SELECT username FROM users WHERE id = ?`,
        [conv.user_a === currentUserId ? conv.user_b : conv.user_a]
      );
      return res.json({ ...conv, other_user_username: userRow[0]?.username });
    }

    const [result] = await db.query(
      `INSERT INTO conversations (user_a, user_b, created_at) VALUES (?, ?, UTC_TIMESTAMP())`,
      [currentUserId, other.id]
    );

    const [rows] = await db.query(`SELECT * FROM conversations WHERE id = ?`, [
      result.insertId,
    ]);
    return res
      .status(201)
      .json({ ...rows[0], other_user_username: other.username });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to start converastion for other user" });
  }
};

// Send a message to a user by username
export const sendMessageToUsername = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientUsername, message, messageType = "text" } = req.body;

    // Validate inputs
    if (!recipientUsername || !message) {
      return res
        .status(400)
        .json({ error: "recipientUsername and message are required" });
    }

    // Find recipient by username
    const recipient = await findUserByUsername(recipientUsername);
    if (!recipient)
      return res.status(404).json({ error: "Recipient not found" });
    if (recipient.id === senderId)
      return res.status(400).json({ error: "Cannot message yourself" });

    console.log("Sending message:", {
      senderId,
      recipientId: recipient.id,
      message,
    });

    // Find or create conversation
    const [rows] = await db.query(
      `SELECT * FROM conversations
        WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)
        LIMIT 1`,
      [senderId, recipient.id, recipient.id, senderId]
    );

    let conversationId;
    if (!rows.length) {
      // Create conversation if none exists
      const [result] = await db.query(
        `INSERT INTO conversations (user_a, user_b, created_at) VALUES (?, ?, UTC_TIMESTAMP())`,
        [senderId, recipient.id]
      );
      conversationId = result.insertId;
      console.log("Created new conversation with ID:", conversationId);
    } else {
      conversationId = rows[0].id;
      console.log("Found existing conversation with ID:", conversationId);
    }

    // Insert the message
    const [msgResult] = await db.query(
      `INSERT INTO direct_messages
        (conversation_id, sender_id, ciphertext, nonce, message_type, created_at)
        VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [conversationId, senderId, message, null, messageType]
    );

    console.log("Inserted message with ID:", msgResult.insertId);

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

export const getMessagesByConversationId = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.conversationId;

    // Ensure user is part of the conversation
    const [conv] = await db.query(
      `SELECT * FROM conversations 
        WHERE id = ? AND (user_a = ? OR user_b = ?)`,
      [conversationId, userId, userId]
    );
    if (!conv.length)
      return res.status(404).json({ error: "Conversation not found" });

    const [messages] = await db.query(
      `SELECT * FROM direct_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC`,
      [conversationId]
    );

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get messages from conversation" });
  }
};

// Get messages with a user by username
export const getMessagesWithUsername = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUsername = req.params.username;

    // Find the other user
    const other = await findUserByUsername(otherUsername);

    // Check if user exists
    if (!other) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find conversation
    const [conversation] = await db.query(
      `SELECT * FROM conversations
        WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)
        LIMIT 1`,
      [currentUserId, other.id, other.id, currentUserId]
    );

    // If no conversation exists, return empty messages array
    if (!conversation.length) {
      return res.json({ conversationId: null, messages: [] });
    }

    const conversationId = conversation[0].id;

    // Get messages
    const [messages] = await db.query(
      `SELECT * FROM direct_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC`,
      [conversationId]
    );

    return res.json({ conversationId, messages });
  } catch (err) {
    console.error("Error in getMessagesWithUsername:", err);
    return res.status(500).json({ error: "Failed to get messages from other user" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const convId = req.params.id;
    const userId = req.user.id;

    const [rows] = await db.execute(
      "SELECT * FROM conversations WHERE id = ? AND (user_a = ? OR user_b = ?)",
      [convId, userId, userId]
    );

    if (!rows.length) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this conversation" });
    }

    // Get all image messages before deleting
    const [imageMessages] = await db.execute(
      "SELECT ciphertext FROM direct_messages WHERE conversation_id = ? AND message_type = 'image'",
      [convId]
    );

    // console.log("Found image messages:", imageMessages);

    // Delete image files from server
    let deletedImagesCount = 0;
    for (const msg of imageMessages) {
      try {
        // Convert Buffer to string if needed
        let imagePath = msg.ciphertext;
        if (Buffer.isBuffer(imagePath)) {
          imagePath = imagePath.toString("utf8"); // Convert Buffer to string
        }

        // console.log("Processing image path (string):", imagePath);

        // Build full path: msg.ciphertext is like "/uploads/images/filename.jpg"
        const fullPath = path.join(__dirname, "..", imagePath);

        // console.log("Full image path:", fullPath);
        // console.log("File exists?", fs.existsSync(fullPath));

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          deletedImagesCount++;
          // console.log(`Deleted image: ${fullPath}`);
        } else {
          // console.log(`File not found: ${fullPath}`);
        }
      } catch (err) {
        console.error(`Error deleting image file:`, err);
      }
    }

    console.log(`Total images deleted: ${deletedImagesCount}`);

    // Delete messages
    await db.execute("DELETE FROM direct_messages WHERE conversation_id = ?", [
      convId,
    ]);
    // Delete the conversation
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

// Send image message
export const sendImageToUsername = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientUsername, message } = req.body;

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

    // Find or create conversation
    const [rows] = await db.query(
      `SELECT * FROM conversations
        WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)
        LIMIT 1`,
      [senderId, recipient.id, recipient.id, senderId]
    );

    let conversationId;
    if (!rows.length) {
      const [result] = await db.query(
        `INSERT INTO conversations (user_a, user_b, created_at) VALUES (?, ?, UTC_TIMESTAMP())`,
        [senderId, recipient.id]
      );
      conversationId = result.insertId;
    } else {
      conversationId = rows[0].id;
    }

    // Image should have been uploaded prior to this function call
    const imageUrl = `/uploads/images/${req.file.filename}`;

    const [msgResult] = await db.query(
      `INSERT INTO direct_messages
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