import express from 'express';
import {
  registerUser,
  loginUser,
  getUserByUsername,
  updateUser,
  deleteUser,
  getAllUsers,
} from '../controllers/user-controller.js';

const router = express.Router();

router.get('/', getAllUsers);
// POST /api/users/register
router.post('/register', registerUser);
// POST /api/users/login
router.post('/login', loginUser);
// GET /api/users/username/:username
router.get('/username/:username', getUserByUsername);
// PATCH /api/users/update
router.patch('/update', updateUser);
// DELETE /api/users/:id
router.delete('/:id', deleteUser);

export default router;