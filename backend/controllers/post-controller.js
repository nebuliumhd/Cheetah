import { db }  from "../db.js";

export const createPost = async (req, res) => {
  const userId = req.user.id;
  const { text, visibility = "public" } = req.body;
  const files = req.files || []; // uploaded images

  try {
    // Insert post
    const [result] = await db.execute(
      "INSERT INTO posts (user_id, text, visibility, likes, created_at, updated_at) VALUES (?, ?, ?, 0, NOW(), NOW())",
      [userId, text, visibility]
    );

    const postId = result.insertId;

    // Insert attachments
    for (const file of files) {
      await db.execute(
        "INSERT INTO post_attachments (post_id, file_path, mime_type, size_bytes, uploaded_at) VALUES (?, ?, ?, ?, NOW())",
        [postId, file.path, file.mimetype, file.size]
      );
    }

    res.status(201).json({ success: true, postId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create post" });
  }
};


// ------------------------- GET MY POSTS -------------------------
export const getMyPosts = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get posts
    const [posts] = await db.execute(
      "SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    // Get attachments for each post
    for (const post of posts) {
      const [attachments] = await db.execute(
        "SELECT * FROM post_attachments WHERE post_id = ?",
        [post.id]
      );
      post.attachments = attachments;
    }

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not get posts" });
  }
};

// ------------------------- GET FEED POSTS -------------------------
export const getFeedPosts = async (req, res) => {
  const userId = req.user.id;

  try {
    // Example: public posts or friends' posts
    const [posts] = await db.execute(
      `SELECT p.*, u.username, u.profile_picture
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.visibility = 'public'
          OR (p.visibility = 'friends' AND p.user_id IN (
            SELECT CASE
                     WHEN user_a = ? THEN user_b
                     ELSE user_a
                   END AS friend_id
            FROM friends_lists
            WHERE (user_a = ? OR user_b = ?) AND status = 'accepted'
          ))
       ORDER BY p.created_at DESC`,
      [userId, userId, userId]
    );

    for (const post of posts) {
      const [attachments] = await db.execute(
        "SELECT * FROM post_attachments WHERE post_id = ?",
        [post.id]
      );
      post.attachments = attachments;

      const [comments] = await db.execute(
        `SELECT c.*, u.username, u.profile_picture 
         FROM comments c
         JOIN users u ON u.id = c.user_id
         WHERE c.post_id = ?
         ORDER BY c.created_at ASC`,
        [post.id]
      );
      post.comments = comments;
    }

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not get feed posts" });
  }
};

// ------------------------- GET POST BY ID -------------------------
export const getPostById = async (req, res) => {
  const { postId } = req.params;

  try {
    const [posts] = await db.execute(
      `SELECT p.*, u.username, u.profile_picture 
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`,
      [postId]
    );

    if (!posts.length) return res.status(404).json({ error: "Post not found" });

    const post = posts[0];

    const [attachments] = await db.execute(
      "SELECT * FROM post_attachments WHERE post_id = ?",
      [postId]
    );
    post.attachments = attachments;

    const [comments] = await db.execute(
      `SELECT c.*, u.username, u.profile_picture 
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );
    post.comments = comments;

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not get post" });
  }
};

// ------------------------- DELETE POST -------------------------
export const deletePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await db.execute(
      "DELETE FROM posts WHERE id = ? AND user_id = ?",
      [postId, userId]
    );

    if (!result.affectedRows) return res.status(404).json({ error: "Post not found" });

    // Optionally delete attachments and comments
    await db.execute("DELETE FROM post_attachments WHERE post_id = ?", [postId]);
    await db.execute("DELETE FROM comments WHERE post_id = ?", [postId]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete post" });
  }
};

// ------------------------- UPDATE POST -------------------------
export const updatePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  const { text } = req.body;

  try {
    const [result] = await db.execute(
      "UPDATE posts SET text = ?, updated_at = NOW() WHERE id = ? AND user_id = ?",
      [text, postId, userId]
    );

    if (!result.affectedRows) return res.status(404).json({ error: "Post not found" });

    res.json({ success: true, text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update post" });
  }
};

// ------------------------- SET POST VISIBILITY -------------------------
export const setPostVisibility = async (req, res) => {
  const { postId } = req.params;
  const { visibility } = req.body;
  const userId = req.user.id;

  if (!["public", "friends"].includes(visibility))
    return res.status(400).json({ error: "Invalid visibility option" });

  try {
    const [result] = await db.execute(
      "UPDATE posts SET visibility = ? WHERE id = ? AND user_id = ?",
      [visibility, postId, userId]
    );

    if (!result.affectedRows) return res.status(404).json({ error: "Post not found" });

    res.json({ success: true, visibility });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update visibility" });
  }
};

// ------------------------- COMMENTS -------------------------
export const AddCommentToPost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  const { text } = req.body;

  try {
    const [result] = await db.execute(
      "INSERT INTO comments (post_id, user_id, text, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      [postId, userId, text]
    );

    res.status(201).json({ success: true, commentId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add comment" });
  }
};

export const DeleteCommentFromPost = async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user.id;

  try {
    // Only comment owner or post owner can delete
    const [result] = await db.execute(
      `DELETE c FROM comments c
       JOIN posts p ON c.post_id = p.id
       WHERE c.id = ? AND c.post_id = ? AND (c.user_id = ? OR p.user_id = ?)`,
      [commentId, postId, userId, userId]
    );

    if (!result.affectedRows) return res.status(404).json({ error: "Comment not found" });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete comment" });
  }
};

// ------------------------- LIKES -------------------------
export const AddLikeToPost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    // Update likes count and optionally store a likes table for users
    await db.execute("UPDATE posts SET likes = likes + 1 WHERE id = ?", [postId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not like post" });
  }
};

export const RemoveLikeFromPost = async (req, res) => {
  const { postId } = req.params;

  try {
    await db.execute("UPDATE posts SET likes = IF(likes>0, likes-1, 0) WHERE id = ?", [postId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not unlike post" });
  }
};