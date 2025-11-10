import { db } from "../db.js";

// Create new user
export const createUser = async (userData) => {
  const { firstName, lastName, email, userName, passWord } = userData;
  const passWordHash = await bcrypt.hash(passWord, 10);
  const query = `
    INSERT INTO users (first_name, last_name, email, username, password_hash)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = db.query(query, [firstName, lastName, email, userName, passWordHash]);
  return result;
};

// Get user by username
export const findUserByUsername = async (userName) => {
  const [rows] = await db.query("SELECT * FROM users WHERE user_name = ?", [userName]);
  return rows[0];
};

// Get user by email
export const findUserByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
};