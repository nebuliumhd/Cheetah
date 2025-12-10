import multer from "multer";
import fs from "fs";
import path from "path";

// Storage for images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads/images/";
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Storage for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads/videos/";
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Image upload configuration
const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Video upload configuration (50MB limit for videos)
const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mov|avi|mkv|webm/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = file.mimetype.startsWith('video/');

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only video files are allowed!"));
    }
  },
});

// Middleware functions for handling uploads
export const uploadImage = (req, res, next) => {
  imageUpload.single("image")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File size exceeds limit of 5MB" });
      }
      return res
        .status(400)
        .json({ error: err.message || "File upload error" });
    }
    next();
  });
};

export const uploadVideo = (req, res, next) => {
  videoUpload.single("video")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File size exceeds limit of 50MB" });
      }
      return res
        .status(400)
        .json({ error: err.message || "File upload error" });
    }
    next();
  });
};

export const uploadPostImages = (req, res, next) => {
  imageUpload.array("attachments", 10)(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "One or more files exceed the 5MB limit" });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ error: "Maximum 10 images allowed per post" });
      }
      return res.status(400).json({ error: err.message || "File upload error" });
    }
    next();
  });
};

export const uploadProfilePicture = (req, res, next) => {
  const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = "./uploads/profiles/";
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const userId = req.user.id;
      const uniqueName = `profile_${userId}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

  const profileUpload = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error("Only image files are allowed!"));
      }
    },
  });

  profileUpload.single("profilePicture")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File size exceeds limit of 5MB" });
      }
      return res
        .status(400)
        .json({ error: err.message || "File upload error" });
    }
    next();
  });
};