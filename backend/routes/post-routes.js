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
// Like a post
//router.post("/:postId/like", addLikeToPost);
// Unlike a post
//router.delete("/:postId/like", removeLikeFromPost);

export default router;