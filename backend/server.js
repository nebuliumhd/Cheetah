import express from "express";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import userRoutes from "./routes/user-routes.js";
import chatRoutes from "./routes/chat-routes.js";
import authRoutes from "./routes/auth-routes.js";
import feedRoutes from "./routes/feed-routes.js"
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

// IMPORTANT: Serve uploads BEFORE other routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/chat", authMiddleware, chatRoutes);
app.use("/api/feed", feedRoutes)
app.use("/api/auth", authRoutes);

// Serve React build (for production)
app.use(express.static(path.join(__dirname, "../frontend/build")));

// Catch-all route for React (MUST BE LAST)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

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