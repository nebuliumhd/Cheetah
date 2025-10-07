const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  userName:  { type: String, required: true, unique: true },
  passWord:  { type: String, required: true }, // Will store hashed password
}, { timestamps: true }); // Adds createdAt and updatedAt

module.exports = mongoose.model('User', userSchema);