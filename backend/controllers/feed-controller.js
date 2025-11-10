import { db } from "../db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function areFriends(userAId, userBId) {
  const [rows] = await db.query(
    `SELECT 1 FROM railway.friends_lists
        WHERE (user_a = ? AND user_b = ? AND status = 'accepted')
        OR (user_b = ? AND user_a = ? AND status = 'accepted')
        LIMIT 1`,
    [userAId, userBId, userAId, userBId]
  );
  return rows.length > 0;
}

export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text, visibility, attachmentIds } = req.body;

    if (!text || text.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Text is required for a post" });
    }

    const knownVisibilities = ["public", "friends", "private"];
    const selectedVisibility = knownVisibilities.includes(visibility)
      ? visibility
      : "private";

    const [result] = await db.query(
      `INSERT INTO posts (user_id, text, visibility, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
      [userId, text.trim(), selectedVisibility]
    );
    const postId = result.insertId;

    // Handle file attachments if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const filePath = `/uploads/images/${file.filename}`;
          const mimeType = file.mimetype;
          const sizeBytes = file.size;

          // Insert into attachments table
          const [attachmentResult] = await db.query(
            `INSERT INTO railway.attachments (owner_id, file_path, mime_type, size_bytes, uploaded_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [userId, filePath, mimeType, sizeBytes]
          );

          const attachmentId = attachmentResult.insertId;

          // Link attachment to post
          await db.query(
            `INSERT INTO railway.post_attachments (post_id, attachment_id)
             VALUES (?, ?)`,
            [postId, attachmentId]
          );
        } catch (fileErr) {
          console.error("Error processing file:", file.filename, fileErr);
          // Continue with other files even if one fails
        }
      }
    }

    // Get the created post with user info and attachments
    const [posts] = await db.query(
      `SELECT 
        p.id,
        p.user_id,
        p.text,
        p.created_at,
        p.updated_at,
        p.visibility,
        u.first_name,
        u.last_name,
        u.username
      FROM railway.posts p
      JOIN railway.users u ON (p.user_id = u.id)
      WHERE p.id = ?`,
      [postId]
    );

    const post = posts[0];

    // Get attachments
    const [attachments] = await db.query(
      `SELECT 
        a.id,
        a.file_path,
        a.mime_type,
        a.size_bytes,
        a.uploaded_at
      FROM post_attachments pa
      JOIN attachments a ON pa.attachment_id = a.id
      WHERE pa.post_id = ?
      ORDER BY a.uploaded_at ASC`,
      [postId]
    );

    post.attachments = attachments;

    res.status(201).json({
      message: "Post created successfully",
      post: posts[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create post" });
  }
};

export const getFeed = async (req, res) => {
  try {
    const userId = req.user.id;

    // For when we add scrolling down the main feed later
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const [posts] = await db.query(
      `SELECT
            p.id
            p.user_id,
            p.text,
            p.visibility,
            p.created_at,
            p.updated_at,
            u.first_name,
            u.last_name,
            u.username,
            (SELECT COUNT(*) FROM railway.comments WHERE post_id = p.id) AS comment_count
        FROM railway.posts p
        JOIN railway.users u ON (p.user_id = u.id)
        WHERE
        (
            -- Posts created by us (the user // TODO: Remove later)
            p.user_id = ?
            OR
            -- Posts created by friends
            (
                p.user_id IN (
                    SELECT user_b FROM railway.friends_lists
                    WHERE user_a = ? AND status = 'accepted'
                    UNION
                    SELECT user_a FROM railway.friends_lists
                    WHERE user_b = ? AND status = 'accepted'
                )
                AND p.visibility IN ('public', 'friends')
            )
            OR
            -- Posts created for 'everyone' by people outside your friends lists
            (
                p.user_id != ? AND p.visibility = 'everyone'
            )
        )
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?`,
      [userId, userId, userId, userId, limit, offset]
    );

    // Get attachments for the posts
    for (const post of posts) {
      const [attachments] = await db.query(
        `SELECT
            a.id
            a.file_path,
            a.mime_type,
            a.size_bytes,
            a.uploaded_at
        FROM railway.post_attachments pa
        JOIN railway.attachments a ON (pa.attachment_id = a.id)
        WHERE pa.post_id = ?
        ORDER BY a.uploaded_at ASC`,
        [postId]
      );
      post.attachments = attachments;
    }

    // Get total count for pagination
    const [countResult] = await db.query(
      `SELECT COUNT(DISTINCT p.id) AS total
            FROM railway.posts p
            WHERE
            (
                p.user_id = ?
                OR
                (
                    p.user_id IN (
                        SELECT user_b FROM railway.friends_lists
                        WHERE user_a = ? AND status = 'accepted'
                        UNION
                        SELECT user_a FROM railway.friends_lists
                        WHERE user_b = ? AND status = 'accepted' 
                    )
                    AND p.visibility IN ('everyone', 'friends')
                )
                OR
                (
                    p.user_id != ? AND p.visibility = 'everyone'
                )
            )`,
      [userId, userId, userId, userId]
    );

    const totalPosts = countResult[0].total;
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        postsPerPage: limit,
        hasMore: page < totalPages,
      },
    });
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ error: "Failed to get feed" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;

    const [posts] = await db.query(
      `SELECT
            p.id
            p.user_id,
            p.text,
            p.visibility,
            p.created_at,
            p.updated_at,
            u.first_name,
            u.last_name,
            u.username
        FROM railway.posts p
        JOIN railway.users u ON (p.user_id = u.id)
        WHERE p.id = ?`,
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = posts[0];
    // View your own posts
    if (post.visibility === "private" && post.user_id !== userId) {
      return res
        .status(403)
        .json({ error: "You don't have permission to view this post" });
    }
    // View friends posts
    if (post.visibility === "friends" && post.user_id !== userId) {
      const friends = await areFriends(userId, post.user_id);
      if (!friends) {
        return res
          .status(403)
          .json({ error: "You don't have permission to view this post" });
      }
    }

    // Get attachments
    const [attachments] = await db.query(
      `SELECT
            a.id,
            a.file_path,
            a.mime_type,
            a.size_bytes,
            a.uploaded_at
        FROM railway.post_attachments pa
        JOIN railway.attachments a ON (pa.attachment_id = a.id)
        WHERE pa.post_id = ?
        ORDER BY a.uploaded_at ASC`,
      [postId]
    );
    post.attachments = attachments;

    // Get comments
    const [comments] = await db.query(
      `SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.text,
        c.created_at,
        c.updated_at,
        u.first_name,
        u.last_name,
        u.username
      FROM railway.comments c
      JOIN railway.users u ON (c.user_id = u.id)
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC`,
      [postId]
    );
    post.comments = comments;

    res.json({ post });
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ error: "Could not fetch post from user" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;

    // Check if post exists and belongs to user
    const [posts] = await db.query(
      `SELECT user_id FROM railway.posts WHERE id = ?`,
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (posts[0].user_id !== userId) {
      return res
        .status(403)
        .json({ error: "You don't have permission to delete this post" });
    }

    // Get all attachments associated with this post
    const [attachments] = await db.query(
      `SELECT a.file_path
       FROM railway.post_attachments pa
       JOIN railway.attachments a ON (pa.attachment_id = a.id)
       WHERE pa.post_id = ?`,
      [postId]
    );

    // Delete all post attachments associated with the post
    await db.query(`DELETE FROM railway.post_attachments WHERE post_id = ?`, [
      postId,
    ]);

    // Delete attachments and their files from disk
    for (const attachment of attachments) {
      try {
        // Convert Buffer to string if needed
        let filePath = attachment.file_path;
        if (Buffer.isBuffer(filePath)) {
          filePath = filePath.toString("utf8");
        }

        const fullPath = path.join(__dirname, "..", filePath);

        // Delete file from disk
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`Deleted file: ${fullPath}`);
        }
      } catch (fileErr) {
        console.error(`Error deleting attachment ${attachment.id}:`, fileErr);
        // Continue even if one file fails
      }
    }

    res.json({ message: "Post deleted succesfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: "Failed to delete the post" });
  }
};

export const createComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    // Check if post exists and user can view it
    const [posts] = await db.query(
      `SELECT user_id, visibility FROM posts WHERE id = ?`,
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = posts[0];

    // Check permissions
    if (post.visibility === "private" && post.user_id !== userId) {
      return res
        .status(403)
        .json({ error: "You don't have permission to comment on this post" });
    }

    if (post.visibility === "friends" && post.user_id !== userId) {
      const friends = await areFriends(userId, post.user_id);
      if (!friends) {
        return res
          .status(403)
          .json({ error: "You don't have permission to comment on this post" });
      }
    }

    // Create comment
    const [result] = await db.query(
      `INSERT INTO railway.comments (post_id, user_id, text, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [postId, userId, text.trim()]
    );

    // Get the created comment with user info
    const [comments] = await db.query(
      `SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.text,
        c.created_at,
        c.updated_at,
        u.first_name,
        u.last_name,
        u.username
      FROM railway.comments c
      JOIN railway.users u ON (c.user_id = u.id)
      WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ comment: comments[0] });
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId, commentId } = req.params;

    // Check if comment exists and belongs to user
    const [comments] = await db.query(
      `SELECT user_id, post_id FROM railway.comments WHERE id = ? AND post_id = ?`,
      [commentId, postId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const comment = comments[0];

    // Check if user owns the comment or the post
    const [posts] = await db.query(
      `SELECT user_id FROM railway.posts WHERE id = ?`,
      [postId]
    );

    if (comment.user_id !== userId && posts[0].user_id !== userId) {
      return res
        .status(403)
        .json({ error: "You don't have permission to delete this comment" });
    }

    // Delete comment
    await db.query(`DELETE FROM railway.comments WHERE id = ?`, [commentId]);

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: "Failed to delete a comment" });
  }
};
