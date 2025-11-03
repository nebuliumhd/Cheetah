import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from "cors";
import userRoutes from './routes/user-routes.js';
import chatRoutes from './routes/chat-routes.js';
import authRoutes from './routes/auth-routes.js';
import { authMiddleware } from './middleware/auth-middleware.js';

const app = express();
const PORT = 5000;

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

// IMPORTANT: Serve uploads BEFORE other routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/users', userRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/auth', authRoutes);

// Serve React build (for production)
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch-all route for React (MUST BE LAST)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});