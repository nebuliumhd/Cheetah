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
  AddCommentToPost,
  DeleteCommentFromPost,
  AddLikeToPost,
  RemoveLikeFromPost,

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
// Update a post
router.patch("/:postId", updatePost);
// Get a specific post by ID
router.get("/:postId", getPostById);
// Set post visibility
router.patch("/:postId/visibility", setPostVisibility);
// Add comment to post
router.post("/:postId/comment", AddCommentToPost);
// Delete comment from post
router.delete("/:postId/comment/:commentId", DeleteCommentFromPost);
// Like a post
router.post("/:postId/like", AddLikeToPost);
// Unlike a post
router.delete("/:postId/like", RemoveLikeFromPost);

export default router;