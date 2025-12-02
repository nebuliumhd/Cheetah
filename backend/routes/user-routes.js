import express from 'express';
import {
  registerUser,
  loginUser,
  getUserByUsername,
  updateUser,
  deleteUser,
  getAllUsers,
  updatePFP,
  getFriends,
  sendFriendRequest,
  recieveFriendRequest,
  pendingFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  updateBio
} from '../controllers/user-controller.js';

import { uploadProfilePicture } from '../middleware/upload-middleware.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

const router = express.Router();   // ✅ must come before any router.use or router.get/post/etc

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.use(authMiddleware);
router.get('/', getAllUsers);
router.get('/username/:username', getUserByUsername);
router.patch('/update', updateUser);
router.delete('/:id', deleteUser);
router.patch('/update-pfp', uploadProfilePicture, updatePFP);
router.get("/list", getFriends);
router.get("/requests/incoming", recieveFriendRequest);
router.get("/requests/outgoing", pendingFriendRequest);
router.post("/friend-request/:username", sendFriendRequest);
router.post("/accept-friend/:username", acceptFriendRequest);
router.post("/decline-friend/:username", declineFriendRequest);
router.delete("/remove-friend/:username", removeFriend);
router.patch("/update-bio", updateBio);

export default router;

