import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db }  from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET;

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
    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Email or username already in use." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user
    await db.query(
      "INSERT INTO users (first_name, last_name, username, email, password_hash) VALUES (?, ?, ?, ?, ?)",
      [first_name, last_name, username, email, hashedPassword]
    );

    res.status(201).json({ message: "User registered successfully." });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// LOGIN USER WITH LOCKOUT + JWT
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // --- 1. Check if user exists ---
    const [users] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid username.", body: username });
    }

    const user = users[0];

    // --- 2. Check lockout ---
    if (user.lock_until && user.lock_until > Date.now()) {
      return res.status(403).json({
        message: "Account is locked. Try again later.",
        unlockTime: user.lock_until
      });
    }

    // --- 3. Validate password ---
    const isValidPassword = await bcrypt.compare(password, user.password_hash);


    if (!isValidPassword) {
      let attempts = user.failed_attempts + 1;
      let lockUntil = null;

      // Lock after 5 attempts
      if (attempts >= 5) {
        const lockDurationMinutes = 10;
        const lockDate = new Date(Date.now() + lockDurationMinutes * 60 * 1000);

        // Format DATETIME for MySQL
        lockUntil = lockDate.toISOString().slice(0, 19).replace("T", " ");
      }

      // Update failed attempts + lock time
      await db.query(
        "UPDATE users SET failed_attempts = ?, lock_until = ? WHERE id = ?",
        [attempts, lockUntil, user.id]
      );

      return res.status(401).json({
        message: "Invalid password.",
        attemptsLeft: Math.max(0, 5 - attempts),
        locked: attempts >= 5,
        body: password
      });
    }

    // --- 4. Reset lockout on successful login ---
    await db.query(
      "UPDATE users SET failed_attempts = 0, lock_until = NULL WHERE id = ?",
      [user.id]
    );

    // --- 5. Create JWT token ---
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Signed token:", token);

    // --- 6. Successful response ---
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        profile_picture: user.profile_picture,
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

    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (users.length === 0) return res.status(404).json({ message: "User not found." });

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ message: "Incorrect password." });

    await db.query("DELETE FROM users WHERE id = ?", [user.id]);
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

    if (!id) return res.status(400).json({ message: "User ID is required." });

    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (users.length === 0) return res.status(404).json({ message: "User not found." });

    const user = users[0];

    // Check username uniqueness only if changed
    if (username && username !== user.username) {
      const [checkUser] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
      if (checkUser.length > 0) return res.status(400).json({ message: "Username already in use." });
    }

    // Check email uniqueness only if changed
    if (email && email !== user.email) {
      const [checkEmail] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      if (checkEmail.length > 0) return res.status(400).json({ message: "Email already in use." });
    }

    // Hash password if changed
    const newPasswordHash = password ? await bcrypt.hash(password, 12) : user.password_hash;

    // Update only fields that were provided
    const updatedUser = {
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      username: username || user.username,
      email: email || user.email,
      password_hash: newPasswordHash,
    };

    await db.query(
      `UPDATE users SET first_name=?, last_name=?, username=?, email=?, password_hash=? WHERE id=?`,
      [
        updatedUser.first_name,
        updatedUser.last_name,
        updatedUser.username,
        updatedUser.email,
        updatedUser.password_hash,
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
    const [users] = await db.query(
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
    const [results] = await db.query("SELECT * FROM users");
    res.status(200).json(results);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Database error." });
  }
};
// UPDATE PROFILE PICTURE

export const updatePFP = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.user.id;
    const filename = req.file.filename;

    // Save the relative path for DB
    const profilePicPath = `/uploads/images/${filename}`;

    await db.query(
      "UPDATE users SET profile_picture = ? WHERE id = ?",
      [profilePicPath, userId]
    );

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicture: profilePicPath,
    });
  } catch (err) {
    console.error("Error updating profile picture:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFriends = async (req, res) => {
    const userId = req.user.id;

    try {
        const [rows] = await db.execute(
            `
            SELECT 
                f.id,
                u.id AS friend_id,
                u.username,
                u.profile_picture
            FROM friends_lists  f
            JOIN users u 
              ON (
                    (u.id = f.user_a AND f.user_b = ?) OR
                    (u.id = f.user_b AND f.user_a = ?)
                 )
            WHERE f.status = 'accepted'
            `,
            [userId, userId]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not load friends" });
    }
};

export const sendFriendRequest = async (req, res) => {
    const userId = req.user.id;
    const targetUsername = req.params.username;

    try {
        // Get target user by username
        const [targetUser] = await db.execute(
            `SELECT id FROM users WHERE username = ?`,
            [targetUsername]
        );

        if (targetUser.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const targetId = targetUser[0].id;

        if (targetId === userId) {
            return res.status(400).json({ error: "You cannot friend yourself" });
        }

        // Check if friendship or request exists already
        const [existing] = await db.execute(
            `SELECT * FROM friends_lists              WHERE (user_a = ? AND user_b = ?)
                OR (user_a = ? AND user_b = ?)`,
            [userId, targetId, targetId, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: "Friend request already exists" });
        }

        // Create friend request (user_a = sender, user_b = receiver)
        await db.execute(
            `INSERT INTO friends_lists (user_a, user_b, status)
             VALUES (?, ?, 'pending')`,
            [userId, targetId]
        );

        res.json({ message: "Friend request sent" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send friend request" });
    }
};

export const acceptFriendRequest = async (req, res) => {
    const userId = req.user.id;
    const fromUsername = req.params.username;

    try {
        // Find the user who sent the request
        const [fromUser] = await db.execute(
            `SELECT id FROM users WHERE username = ?`,
            [fromUsername]
        );

        if (fromUser.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const fromId = fromUser[0].id;

        // Check the pending request
        const [request] = await db.execute(
            `SELECT * FROM friends_lists              WHERE user_a = ? AND user_b = ? AND status = 'pending'`,
            [fromId, userId]
        );

        if (request.length === 0) {
            return res.status(404).json({ error: "No pending request from this user" });
        }

        // Accept it
        await db.execute(
            `UPDATE friends_lists SET status = 'accepted'
             WHERE user_a = ? AND user_b = ?`,
            [fromId, userId]
        );

        res.json({ message: "Friend request accepted" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to accept friend request" });
    }
};

export const declineFriendRequest = async (req, res) => {
    const userId = req.user.id;
    const fromUsername = req.params.username;

    try {
        const [fromUser] = await db.execute(
            `SELECT id FROM users WHERE username = ?`,
            [fromUsername]
        );

        if (fromUser.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const fromId = fromUser[0].id;

        // Delete pending request
        const [result] = await db.execute(
            `DELETE FROM friends_lists              WHERE user_a = ? AND user_b = ? AND status = 'pending'`,
            [fromId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No pending request to decline" });
        }

        res.json({ message: "Friend request declined" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to decline friend request" });
    }
};

export const removeFriend = async (req, res) => {
    const userId = req.user.id;
    const username = req.params.username;

    try {
        const [targetUser] = await db.execute(
            `SELECT id FROM users WHERE username = ?`,
            [username]
        );

        if (targetUser.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const targetId = targetUser[0].id;

        // Remove friendship (accepted only)
        const [result] = await db.execute(
            `DELETE FROM friends_lists              WHERE status = 'accepted'
               AND (
                    (user_a = ? AND user_b = ?) OR
                    (user_a = ? AND user_b = ?)
               )`,
            [userId, targetId, targetId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Friendship not found" });
        }

        res.json({ message: "Friend removed" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to remove friend" });
    }
};

// user-controller.js
export const recieveFriendRequest = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.username, u.profile_picture
       FROM friends_lists f
       JOIN users u ON u.id = f.user_a
       WHERE f.user_b = ? AND f.status = 'pending'`,
      [userId]
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load incoming friend requests" });
  }
};

// user-controller.js
export const pendingFriendRequest = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.username, u.profile_picture
       FROM friends_lists f
       JOIN users u ON u.id = f.user_b
       WHERE f.user_a = ? AND f.status = 'pending'`,
      [userId]
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load outgoing friend requests" });
  }
};

export const updateBio = async (req, res) => {
  const userId = req.user.id;  // From authMiddleware
  const { bio } = req.body;

  if (!bio || bio.length > 200) {
    return res.status(400).json({ error: "Bio must be 1-200 characters long" });
  }

  try {
    await db.execute(
      `UPDATE users SET bio = ? WHERE id = ?`,
      [bio, userId]
    );

    res.json({ message: "Bio updated successfully", bio });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update bio" });
  }
};

