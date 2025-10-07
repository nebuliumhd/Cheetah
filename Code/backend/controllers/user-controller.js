w

const bcrypt = require('bcryptjs');
const User = require('../models/user-model');
const { get } = require('mongoose');

const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, address, userName, passWord } = req.body;

    // Check if email or username already exists
    const emailExists = await User.findOne({ email });
    const usernameExists = await User.findOne({ userName });

    if (emailExists || usernameExists) {
      return res.status(400).json({ message: 'Email or username already in use.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passWord, 12);

    // Create and save user
    const newUser = new User({
      firstName,
      lastName,
      email,
      address,
      userName,
      passWord: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully.' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

const loginUser = async (req, res) => {
  const { userName, passWord } = req.body;

  try {
    const existingUser = await User.findOne({ userName });

    if (!existingUser) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const isValidPassword = await bcrypt.compare(passWord, existingUser.passWord);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    res.status(200).json({ message: 'Login successful', user: { id: existingUser.id, userName: existingUser.userName } });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Something went wrong during login.' });
  }
};

const deleteUser = async (req, res) => {
  const { userName, passWord } = req.body;

  try {
    const user = await User.findOne({ userName });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isValid = await bcrypt.compare(passWord, user.passWord);
    if (!isValid) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    await User.deleteOne({ _id: user._id });
    return res.status(200).json({ message: 'Account successfully deleted.' });

  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id, userName, passWord, firstName, lastName, email } = req.body;

    const user = await User.findOne({ id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if username is being changed
    if (userName !== user.userName) {
      const usernameTaken = await User.findOne({ userName });
      if (usernameTaken) {
        return res.status(400).json({ message: 'Username already in use' });
      }
      user.userName = userName;
    }

    if (email && email !== user.email) {
      const emailTaken = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailTaken) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (passWord) user.passWord = await bcrypt.hash(passWord, 12);

    await user.save();
    return res.status(200).json({ message: 'Account updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    return res.status(500).json({ message: 'Something went wrong during update' });
  }
};

const getUserByUsername = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ userName: username }).select('-passWord');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ user });
  } catch (err) {
    console.error('Get user by username error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  deleteUser,
  updateUser,
  getUserByUsername
};  