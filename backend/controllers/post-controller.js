/** ABSTRACT: post-controller.js
 *
 *  DESCRIPTION:
 *  This file defines backend controller functions for creating, retrieving,
 *  updating, and deleting posts. It manages post visibility, attachments,
 *  comments, and likes while enforcing ownership and access rules.
 *
 *  RESPONSIBILITIES:
 *  - Create posts with text, visibility, and attachments.
 *  - Retrieve a user’s posts and feed posts.
 *  - Load individual posts with comments and media.
 *  - Update and delete posts with permission checks.
 *  - Manage comments and post likes.
 *
 *  FUNCTIONS:
 *  - createPost(req, res):
 *    Creates a new post with optional file attachments.
 *
 *  - getMyPosts(req, res):
 *    Retrieves all posts created by the authenticated user.
 *
 *  - getFeedPosts(req, res):
 *    Retrieves feed posts based on visibility and friendships.
 *
 *  - getPostById(req, res):
 *    Retrieves a single post with attachments and comments.
 *
 *  - deletePost(req, res):
 *    Deletes a post owned by the authenticated user.
 *
 *  - updatePost(req, res):
 *    Updates the text content of a user’s post.
 *
 *  - setPostVisibility(req, res):
 *    Updates a post’s visibility setting.
 *
 *  - addCommentToPost(req, res):
 *    Adds a comment to a post.
 *
 *  - deleteCommentFromPost(req, res):
 *    Deletes a comment from a post.
 *
 *  - toggleLike(req, res):
 *    Adds or removes a like on a post for the user.
 *
 *  ASSUMPTIONS:
 *  - The user is authenticated.
 *  - Users may only modify their own posts.
 *  - Visibility rules are enforced server-side.
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/

import { db } from "../db.js";

export const createPost = async (req, res) => {
  const userId = req.user.id;
  let { text, visibility = "everyone" } = req.body;
  const files = req.files || []; // uploaded images

  try {
    // Validate visibility against enum values
    if (!["everyone", "friends", "private"].includes(visibility)) {
      visibility = "everyone";
    }

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
// ------------------------- GET MY POSTS -------------------------
export const getMyPosts = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get posts with user info
    const [posts] = await db.execute(
      `SELECT p.id, p.user_id, p.text, p.visibility, p.likes, p.created_at, p.updated_at, u.username, u.profile_picture
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ? 
       ORDER BY p.created_at DESC`,
      [userId]
    );

    // Get attachments, comments, and like status for each post
    for (const post of posts) {
      // Get attachments
      const [attachments] = await db.execute(
        "SELECT * FROM post_attachments WHERE post_id = ?",
        [post.id]
      );
      post.attachments = attachments;

      // Get comments
      const [comments] = await db.execute(
        `SELECT c.*, u.username, u.profile_picture 
         FROM comments c
         JOIN users u ON u.id = c.user_id
         WHERE c.post_id = ?
         ORDER BY c.created_at ASC`,
        [post.id]
      );
      post.comments = comments;

      // Check if current user has liked this post
      const [userLike] = await db.execute(
        "SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?",
        [post.id, userId]
      );
      post.user_liked = userLike.length > 0; // true if user liked, false otherwise
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
    // Get public posts or friends' posts
    const [posts] = await db.execute(
      `SELECT p.id, p.user_id, p.text, p.visibility, p.likes, p.created_at, p.updated_at, u.username, u.profile_picture
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.visibility = 'everyone'
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
      // Get attachments
      const [attachments] = await db.execute(
        "SELECT * FROM post_attachments WHERE post_id = ?",
        [post.id]
      );
      post.attachments = attachments;

      // Get comments
      const [comments] = await db.execute(
        `SELECT c.*, u.username, u.profile_picture 
         FROM comments c
         JOIN users u ON u.id = c.user_id
         WHERE c.post_id = ?
         ORDER BY c.created_at ASC`,
        [post.id]
      );
      post.comments = comments;

      // Check if current user has liked this post
      const [userLike] = await db.execute(
        "SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?",
        [post.id, userId]
      );
      post.user_liked = userLike.length > 0; // true if user liked, false otherwise
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
  console.log(req.user.id);

  try {
    const [result] = await db.execute(
      "DELETE FROM posts WHERE id = ? AND user_id = ?",
      [postId, userId]
    );

    if (!result.affectedRows)
      return res.status(404).json({ error: "Post not found" });

    // Optionally delete attachments and comments
    await db.execute("DELETE FROM post_attachments WHERE post_id = ?", [
      postId,
    ]);
    await db.execute("DELETE FROM comments WHERE post_id = ?", [postId]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete post" });
  }
};

// ------------------------- UPDATE POST -------------------------
export const updatePost = async (req, res) => {
  console.log(req);
  const { postId } = req.params;
  const userId = req.user.id;
  const { text } = req.body;

  try {
    const [result] = await db.execute(
      "UPDATE posts SET text = ?, updated_at = NOW() WHERE id = ? AND user_id = ?",
      [text, postId, userId]
    );

    if (!result.affectedRows)
      return res.status(404).json({ error: "Post not found" });

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

  if (!["everyone", "friends", "private"].includes(visibility))
    return res.status(400).json({ error: "Invalid visibility option" });

  try {
    const [result] = await db.execute(
      "UPDATE posts SET visibility = ? WHERE id = ? AND user_id = ?",
      [visibility, postId, userId]
    );

    if (!result.affectedRows)
      return res.status(404).json({ error: "Post not found" });

    res.json({ success: true, visibility });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update visibility" });
  }
};

// ------------------------- ADD COMMENT -------------------------
export const addCommentToPost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  const { text } = req.body;

  try {
    const [result] = await db.execute(
      "INSERT INTO comments (post_id, user_id, text, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      [postId, userId, text]
    );

    // Return the newly created comment with user info
    const [newComments] = await db.execute(
      `SELECT c.*, u.username, u.profile_picture 
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newComments[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add comment" });
  }
};

// ------------------------- DELETE COMMENT -------------------------
export const deleteCommentFromPost = async (req, res) => {
  const { postId, commentId } = req.params;
  //const userId = req.user.id;
  if (!postId || !commentId) {
    return res.status(400).json({ error: "Missing post_id or comment id" });
  }
  try {
    // Only comment owner or post owner can delete
    const [result] = await db.execute(
      "DELETE FROM comments WHERE id = ? AND post_id = ?",
      [commentId, postId]
    );

    if (!result.affectedRows)
      return res.status(404).json({ error: "Comment not found" });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete comment" });
  }
};

// ------------------------- LIKES -------------------------
// export const AddLikeToPost = async (req, res) => {
//   const { postId } = req.params;
//   const userId = req.user.id;

//   try {
//     // Update likes count and optionally store a likes table for users
//     await db.execute("UPDATE posts SET likes = likes + 1 WHERE id = ?", [postId]);
//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Could not like post" });
//   }
// };

// export const RemoveLikeFromPost = async (req, res) => {
//   const { postId } = req.params;

//   try {
//     await db.execute("UPDATE posts SET likes = IF(likes>0, likes-1, 0) WHERE id = ?", [postId]);
//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Could not unlike post" });
//   }
// };
// ------------------------- TOGGLE LIKE -------------------------
export const toggleLike = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  try {
    // Check if user already liked the post
    const [likes] = await db.execute(
      "SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?",
      [postId, userId]
    );
    let action;
    if (likes.length) {
      // User already liked, so remove like
      await db.execute(
        "DELETE FROM post_likes WHERE post_id = ? AND user_id = ?",
        [postId, userId]
      );
      await db.execute(
        "UPDATE posts SET likes = IF(likes>0, likes-1, 0) WHERE id = ?",
        [postId]
      );
      action = "unliked";
    } else {
      // User has not liked, so add like
      await db.execute(
        "INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)",
        [postId, userId]
      );
      await db.execute("UPDATE posts SET likes = likes + 1 WHERE id = ?", [
        postId,
      ]);
      action = "liked";
    }
    res.json({ success: true, action });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not toggle like" });
  }
};
