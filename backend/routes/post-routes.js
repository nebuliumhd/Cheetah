/** ABSTRACT: post-routes.js
 *  
 *  DESCRIPTION:
 *  Defines Express routes for managing user posts and comments within the feed system.
 *  All routes are protected with `authMiddleware` to ensure only authenticated users
 *  can interact with posts. Upload middleware is used for handling post image attachments.
 * 
 *  RESPONSIBILITIES:
 *  - Authenticate users before allowing feed interactions.
 *  - Handle creation, retrieval, updating, and deletion of posts.
 *  - Support uploading multiple post images using `uploadPostImages` middleware.
 *  - Manage comments on posts (add and delete).
 *  - Manage post visibility settings (public/private).
 *  - Toggle likes on posts for authenticated users.
 *  - Retrieve user-specific posts and main feed posts with associated comments.
 *
 *  FUNCTIONS/ROUTES:
 *  - POST '/create' : Create a new post with optional image attachments
 *  - GET '/my-posts' : Get all posts by logged-in user
 *  - GET '/feed' : Get feed posts from other users
 *  - DELETE '/:postId' : Delete a specific post
 *  - PATCH '/:postId' : Edit a post
 *  - GET '/:postId' : Get a specific post by ID
 *  - PATCH '/:postId/visibility' : Set post visibility (public/private)
 *  - POST '/:postId/comment' : Add a comment to a post
 *  - DELETE '/:postId/comment/:commentId' : Delete a specific comment
 *  - POST '/:postId/toggle-like' : Toggle like/unlike for a post
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/


import express from "express";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { uploadPostImages } from '../middleware/upload-middleware.js';
import {
  createPost,
  getMyPosts,
  deletePost,
  updatePost,
  getPostById,
  setPostVisibility,
  getFeedPosts,
  addCommentToPost,
  deleteCommentFromPost,
  toggleLike
  //addLikeToPost,
  //removeLikeFromPost,

} from "../controllers/post-controller.js";

const router = express.Router();

router.use(authMiddleware);
// Create a new post
router.post("/create", uploadPostImages, createPost);
// Get logged-in user's posts
router.get("/my-posts", getMyPosts);
// Get feed posts (others)
router.get("/feed", getFeedPosts);
// Delete a post
router.delete("/:postId", deletePost);
// Edit a post
router.patch("/:postId", updatePost);
// Get a specific post by ID
router.get("/:postId", getPostById);
// Set post visibility
router.patch("/:postId/visibility", setPostVisibility);
// Add comment to post
router.post("/:postId/comment/", addCommentToPost);
// Delete comment from post
router.delete("/:postId/comment/:commentId", deleteCommentFromPost);
// Like/unlike a post
router.post("/:postId/toggle-like/", toggleLike);


export default router;