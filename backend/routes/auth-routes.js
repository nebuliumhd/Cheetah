import express from 'express';
import { authMiddleware } from '../middleware/auth-middleware.js';

const router = express.Router();

// Verify token endpoint
router.get('/verify', authMiddleware, (req, res) => {
  // If authMiddleware passes, token is valid and req.user is set
  res.json({
    userId: req.user.id,
    username: req.user.username
  });
});

export default router;