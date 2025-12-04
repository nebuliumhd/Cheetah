import express from "express";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import postRoutes from "./routes/post-routes.js";
import userRoutes from "./routes/user-routes.js";
import chatRoutes from "./routes/chat-routes.js";
import { authMiddleware } from "./middleware/auth-middleware.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  "http://localhost:3000", // Development
  "https://localhost:3000",
  "https://www.chetchat.xyz", // Production HTTPS
];

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with mobile apps or curl requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// IMPORTANT: Serve uploads BEFORE other routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/chat", authMiddleware, chatRoutes);
app.use("/api/posts", authMiddleware, postRoutes);

// Check if build folder exists before serving React
const buildPath = path.join(__dirname, "../frontend/build");
const buildExists = fs.existsSync(buildPath);

if (buildExists) {
  console.log("Serving React production build");
  // Serve React build (for prod)
  app.use(express.static(buildPath));
  // Catch-all route for React (MUST BE LAST) - but NOT for API routes
  app.get("*", (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
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

// SSL;
const certPath = path.join(__dirname, "certs");
try {
  const sslInfo = {
    key: fs.readFileSync(path.join(certPath, "privkey.pem")),
    cert: fs.readFileSync(path.join(certPath, "fullchain.pem")),
  };

  // Start HTTPS server
  https.createServer(sslInfo, app).listen(443, "0.0.0.0", () => {
    console.log("HTTPS Server running on port 443");
  });

  // Redirect HTTP -> HTTPS
  http
    .createServer((req, res) => {
      res.writeHead(301, {
        Location: `https://${req.headers.host}${req.url}`,
      });
      res.end();
    })
    .listen(80, "0.0.0.0", () => {
      console.log("HTTP Server running on port 80 (redirecting to HTTPS)");
    });
} catch (error) {
  console.log("SSL certificates not found... defaulting to development mode.");
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT} (HTTP)`);
  });
}