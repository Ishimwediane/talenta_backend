import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { uploadBook } from '../controllers/bookController.js';
import { authenticateToken, verifyAdmin } from '../middleware/auth.middleware.js';

const router = express.Router(); 

// Only admin can upload books
router.post(
  '/',
  authenticateToken,
  verifyAdmin,
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'bookFile', maxCount: 1 },
  ]),
  uploadBook
);

// router.get('/', getBooks);

export default router;
