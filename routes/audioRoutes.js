import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { 
  uploadAudio, 
  playAudio, 
  getAllAudios, 
  getAudioById, 
 updateAudioStatus, // kept for backward compatibility
  getUserDrafts, 
  deleteAudio 
} from "../controllers/audio.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { tryAuthenticateToken } from "../middleware/tryAuthenticateToken.js";
import { audioUpload } from "../middleware/uploadMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload directory exists (for backward compatibility with existing files)
const uploadDir = path.join(__dirname, '..', 'uploads', 'audio');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created upload directory:', uploadDir);
}

// Configure multer for local storage (fallback for existing files)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `audio-${uniqueSuffix}${extension}`;
    
    console.log('📁 Generated filename:', filename, 'for original:', file.originalname);
    cb(null, filename);
  }
});

const localUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 File received for upload:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Accept audio files only - including webm for recordings
    const allowedMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/x-m4a',
      'audio/webm;codecs=opus',
      'audio/m4a',
      'audio/aac',
      'audio/flac',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      console.log('✅ File type accepted:', file.mimetype);
      cb(null, true);
    } else {
      console.log('❌ File type rejected:', file.mimetype);
      cb(new Error(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`));
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error);
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({ error: 'File too large. Maximum size is 50MB.' });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ error: 'Too many files. Only one file allowed.' });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ error: 'Unexpected file field. Use "audio" field name.' });
      default:
        return res.status(400).json({ error: `Upload error: ${error.message}` });
    }
  } else if (error) {
    console.error('Upload error:', error);
    return res.status(400).json({ error: error.message });
  }
  next();
};

// Protected routes - more specific patterns first
// router.get("/user/all", authenticateToken, getUserAudios);        // Get user's all audios (published + drafts)
router.get("/user/drafts", authenticateToken, getUserDrafts);     // Get user's drafts only
router.post("/upload", authenticateToken, audioUpload.single('audio'), handleMulterError, uploadAudio);
// router.patch("/:id", authenticateToken, updateAudio);            // Update audio (title, description, tags, status)
router.patch("/:id/publish", authenticateToken, updateAudioStatus); // Backward compatibility - publish draft
router.delete("/:id", authenticateToken, deleteAudio);

// Public routes - after protected routes
router.get("/play/:filename", playAudio);        // Stream audio file (for backward compatibility)
router.get("/:id", tryAuthenticateToken, getAudioById);               // Get audio by ID (public for published, owner for drafts)
router.get("/", tryAuthenticateToken, getAllAudios);                  // Get published audios (optionally filtered by category)

// Debug route to test uploads directory
router.get("/debug/uploads", (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    res.json({ 
      uploadDir, 
      exists: fs.existsSync(uploadDir),
      files: files.slice(0, 10) // Show first 10 files
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;