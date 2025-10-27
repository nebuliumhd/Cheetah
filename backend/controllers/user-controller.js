import bcrypt from "bcryptjs";
import { pool }  from "../db.js";

// REGISTER USER
export const registerUser = async (req, res) => {
  try {
    const { first_name, last_name, username, email, password } = req.body;
    if (!first_name ) {
      return res.status(400).json({ message: "First name is required.", body: first_name });
    } else if (!last_name) {
      return res.status(400).json({ message: "Email is required", body: last_name });
    } else if (!username) {
      return res.status(400).json({ message: "Username is required.", body: username });
    } else if (!email) {
      return res.status(400).json({ message: "Email is required.", body: email});
    } else if (!password) {
      return res.status(400).json({ message: "Password is required.", body: password });
    }

    // Check for duplicates
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Email or username already in use." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user
    await pool.query(
      "INSERT INTO users (first_name, last_name, username, email, password_hash) VALUES (?, ?, ?, ?, ?)",
      [first_name, last_name, username, email, hashedPassword]
    );

    res.status(201).json({ message: "User registered successfully." });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid username.", body: username });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid password.", body: password });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    if (users.length === 0) return res.status(404).json({ message: "User not found." });

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ message: "Incorrect password." });

    await pool.query("DELETE FROM users WHERE id = ?", [user.id]);
    res.status(200).json({ message: "Account successfully deleted." });

  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Something went wrong during deletion." });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  try {
    const { id, first_name, last_name, username, email, password } = req.body;

    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    if (users.length === 0) return res.status(404).json({ message: "User not found." });

    const user = users[0];

    // Check username/email uniqueness
    if (username && username !== user.username) {
      const [checkUser] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
      if (checkUser.length > 0) return res.status(400).json({ message: "Username already in use." });
    }

    if (email && email !== user.email) {
      const [checkEmail] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
      if (checkEmail.length > 0) return res.status(400).json({ message: "Email already in use." });
    }

    // Hash password if changed
    const newPasswordHash = password ? await bcrypt.hash(password, 12) : user.password_hash;

    //Update database with updated values
    await pool.query(
      `UPDATE users SET first_name=?, last_name=?, username=?, email=?, password_hash=? WHERE id=?`,
      [
        first_name || user.first_name,
        last_name || user.last_name,
        username || user.username,
        email || user.email,
        newPasswordHash,
        id
      ]
    );

    res.status(200).json({ message: "Account updated successfully." });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Something went wrong during update." });
  }
};


// GET USER BY USERNAME
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const [users] = await pool.query(
      "SELECT id, first_name, last_name, username, email FROM users WHERE userName = ?",
      [username]
    );

    if (users.length === 0) return res.status(404).json({ message: "User not found." });

    res.status(200).json({ user: users[0] });

  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

//Get all users in database
export const getAllUsers = async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM users");
    res.status(200).json(results);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Database error." });
  }
};