/** ABSTRACT: userModels.js
 *  
 *  DESCRIPTION:
 *  Defines database operations for user management.
 *  Includes functions to create new users and retrieve existing users by username or email.
 *  Utilizes parameterized SQL queries for security and bcrypt for password hashing.
 *  Interacts with the MySQL connection pool exported from db.js.
 *
 *  RESPONSIBILITIES:
 *  - Load environment variables using dotenv.
 *  - Configure a MySQL connection pool with host, user, password, database, and port.
 *  - Set connection pool options such as connection limit and queue behavior.
 *  - Export the configured pool for use across the application.
 *
 *  FUNCTIONS:
 *  - createUser(userData, callback): Inserts a new user record into the database.
 *  - findUserByUsername(userName, callback): Retrieves a user record by username.
 *  - findUserByEmail(email, callback): Retrieves a user record by email.
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Johnathan Garland
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/


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