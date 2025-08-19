import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import {
  createBook,
  updateBook,
  getPublishedBooks,
  getMyBooks
} from '../controllers/bookController.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// --- Public Route ---
// GET /api/books -> Gets all PUBLISHED books
router.get('/', getPublishedBooks);

// --- Authenticated Routes ---

// GET /api/books/my-books -> Gets all books (drafts included) for the logged-in user
router.get('/my-books', authenticateToken, getMyBooks);

// POST /api/books -> Create a new book (as a draft by default)
router.post(
  '/',
  authenticateToken,
  // We only expect a cover image now, not a book file
  upload.single('coverImage'),
  createBook
);

// PUT /api/books/:id -> Update a book (save changes, or publish it)
router.put(
  '/:id',
  authenticateToken,
  upload.single('coverImage'),
  updateBook
);

export default router;