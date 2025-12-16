/** ABSTRACT: user-routes.js
 *  
 *  DESCRIPTION:
 *  Defines Express routes for user-related operations, including registration, login,
 *  profile management, friend management, and account deletion. Routes map HTTP
 *  endpoints to the corresponding controller functions, with protected routes
 *  requiring authentication via `authMiddleware`.
 * 
 *  RESPONSIBILITIES:
 *  - Public routes:
 *      - POST '/register': Register a new user
 *      - POST '/login': Authenticate a user and return JWT
 *  - Protected routes (require authentication):
 *      - GET '/': Retrieve all registered users
 *      - GET '/username/:username': Get user by username
 *      - PATCH '/update': Update authenticated user's profile
 *      - DELETE '/:id': Delete authenticated user's account
 *      - PATCH '/update-pfp': Upload and update profile picture
 *      - GET '/list': Get friends list
 *      - GET '/requests/incoming': Get incoming friend requests
 *      - GET '/requests/outgoing': Get outgoing friend requests
 *      - POST '/friend-request/:username': Send a friend request
 *      - POST '/accept-friend/:username': Accept a friend request
 *      - DELETE '/decline-friend/:username': Decline a friend request
 *      - DELETE '/remove-friend/:username': Remove a friend
 *      - PATCH '/update-bio': Update user bio
 *      - GET '/profile/:username': Get user profile by username
 * 
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Johnathan Garland
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/

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
  updateBio,
  getUserProfile
} from '../controllers/user-controller.js';

import { uploadProfilePicture } from '../middleware/upload-middleware.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

const router = express.Router();

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
router.delete("/decline-friend/:username", declineFriendRequest);
router.delete("/remove-friend/:username", removeFriend);
router.patch("/update-bio", updateBio);
router.get("/profile/:username", getUserProfile);

export default router;