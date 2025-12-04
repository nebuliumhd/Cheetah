import express from 'express';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { db } from '../db.js';

const router = express.Router();

router.get('/verify', authMiddleware, async (req, res) => {
  try {
    // Query the database to get full user info including profile_picture
    const [rows] = await db.query(
      'SELECT id, username, profile_picture FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = rows[0];
    
    // Return COMPLETE user data (includes pfp)
    res.json({
      userId: user.id,
      username: user.username,
      profile_picture: user.profile_picture
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;