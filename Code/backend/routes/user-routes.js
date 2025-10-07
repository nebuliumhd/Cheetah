const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,     
  getUserByUsername,   
  updateUser,    
  deleteUser
  
} = require('../controllers/user-controller');

// POST /api/users/register
router.post('/register', registerUser);

//  POST /api/users/login
router.post('/login', loginUser);

//  GET /api/users/:id
router.get('/username/:username', getUserByUsername);

//  PATCH /api/users/:id
router.patch('/update', updateUser);

//  DELETE /api/users/:id
router.delete('/:id', deleteUser);

module.exports = router;
