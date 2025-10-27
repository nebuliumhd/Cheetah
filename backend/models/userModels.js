import { db } from "../db.js";

// Create new user
export const createUser = (userData, callback) => {
  const { firstName, lastName, email, userName, passWord } = userData;
  const query = `
    INSERT INTO users (firstName, lastName, email, userName, passWord)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(query, [firstName, lastName, email, userName, passWord], callback);
};

// Get user by username
export const findUserByUsername = (userName, callback) => {
  const query = "SELECT * FROM users WHERE userName = ?";
  db.query(query, [userName], callback);
};

// Get user by email
export const findUserByEmail = (email, callback) => {
  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], callback);
};