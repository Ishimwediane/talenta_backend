import express from 'express';
// import upload from '../middleware/uploadMiddleware.js'; // Old import
import { bookUpload } from '../middleware/uploadMiddleware.js'; // New import
import {
  createBook,
  updateBook,
  getPublishedBooks,
  getMyBooks,
  getBookById,
  deleteBook
} from '../controllers/bookController.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { tryAuthenticateToken } from '../middleware/tryAuthenticateToken.js';
import { readBook, downloadBook } from '../controllers/bookFileController.js';
import { toggleBookLike, rateBook, commentBook, viewBook, shareBook } from '../controllers/engagement.controller.js';

const router = express.Router();

// Middleware for handling cover and book file uploads to Cloudinary
const bookUploadMiddleware = bookUpload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'bookFile', maxCount: 1 },
]);

// --- Public Routes ---
router.get('/', getPublishedBooks);
// Public book reading endpoints (must come before /:id route)
router.get('/read/:filename', readBook);
router.get('/download/:filename', downloadBook);

// --- Authenticated Routes ---
router.get('/my-books', authenticateToken, getMyBooks);
// Public book access (optional auth - allows reading published books without login)
router.get('/:id', tryAuthenticateToken, getBookById);
router.post('/', authenticateToken, bookUploadMiddleware, createBook);
router.put('/:id', authenticateToken, bookUploadMiddleware, updateBook);
router.delete('/:id', authenticateToken, deleteBook);

// Engagement routes
router.post('/:id/like', authenticateToken, toggleBookLike);
router.post('/:id/rate', authenticateToken, rateBook);
router.post('/:id/comment', authenticateToken, commentBook);
router.post('/:id/view', tryAuthenticateToken, viewBook);
router.post('/:id/share', tryAuthenticateToken, shareBook);
export default router;