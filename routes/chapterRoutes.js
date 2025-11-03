import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { tryAuthenticateToken } from '../middleware/tryAuthenticateToken.js';
import {
  getBookChapters,
  getChapter,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters
} from '../controllers/chapterController.js';

const router = express.Router();

// Public routes - allow reading published chapters without authentication
router.get('/books/:bookId/chapters', tryAuthenticateToken, getBookChapters);
router.get('/chapters/:chapterId', tryAuthenticateToken, getChapter);

// Protected routes - require authentication for creating/updating/deleting
router.post('/books/:bookId/chapters', authenticateToken, createChapter);
router.put('/chapters/:chapterId', authenticateToken, updateChapter);
router.delete('/chapters/:chapterId', authenticateToken, deleteChapter);
router.put('/books/:bookId/chapters/reorder', authenticateToken, reorderChapters);

export default router;

