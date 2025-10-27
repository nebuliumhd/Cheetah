import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from "cors";
import userRoutes from './routes/user-routes.js'

const app = express();
const PORT = 5000;

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors()); // Allow frontend requests
app.use(express.json()); // Parse JSON bodies


// API route
//app.get('/api/users', userRoutes);
app.use('/api/users', userRoutes)
app.use('/api/users/register', userRoutes)
app.use('/api/users/login', userRoutes)

// Serve React build
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch-all route for React (must be after API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});