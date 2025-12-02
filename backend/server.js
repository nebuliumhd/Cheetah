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

// Check if build folder exists before serving React
const buildPath = path.join(__dirname, "../frontend/build");
const buildExists = fs.existsSync(buildPath);

if (buildExists) {
  console.log("Serving React production build");
  // Serve React build (for prod)
  app.use(express.static(buildPath));
  // Catch-all route for React (MUST BE LAST)
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  console.log("Build folder not found - running in API-only mode\nRun 'npm run build' in frontend folder to create production build");
  // Helpful message for any unmatched routes (possibly remove later?)
  app.get("*", (req, res) => {
    res.status(404).json({ 
      error: "API endpoint not found",
      message: "Server is running in development mode. Start React dev server separately."
    });
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});