import express from 'express';
import {
    getFeed,
    createPost,
    getPostById,
    deletePost,
    deletePost,
    createComment,
    deleteComment
} from '../controllers/feed-controller.js'
import { authMiddleware } from '../middleware/auth-middleware.js';
import { uploadPostImages } from '../middleware/upload-middleware.js';

const router = express.Router();

// Make sure user is authenticated before accessing chat routes
router.use(authMiddleware);
// Create a new post
router.post('/', uploadPostImages, createPost);
// Get the first 10 most recent posts (and its comments) from friends or those publically available
router.get('/', getFeed);
// Get a single post (and its comments)
router.get('/post/:postId', getPostById);
// Delete a post
router.delete('/post/:postId', deletePost);
// Create a comment underneath of a post
router.post('/post/:postId/comment', createComment);
// Delete a comment
router.delete('/post/:postId/:commentId', deleteComment);

export default router;