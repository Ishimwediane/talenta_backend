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

const router = express.Router();

// Middleware for handling cover and book file uploads to Cloudinary
const bookUploadMiddleware = bookUpload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'bookFile', maxCount: 1 },
]);

// --- Public Route ---
router.get('/', getPublishedBooks);

// --- Authenticated Routes ---
router.get('/my-books', authenticateToken, getMyBooks);
router.get('/:id', tryAuthenticateToken, getBookById);
router.post('/', authenticateToken, bookUploadMiddleware, createBook);
router.put('/:id', authenticateToken, bookUploadMiddleware, updateBook);
router.delete('/:id', authenticateToken, deleteBook);


router.get('/read/:filename', readBook);

// Route for downloading book
router.get('/download/:filename', downloadBook);
export default router;