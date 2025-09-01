import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  getBookChapters,
  getChapter,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters
} from '../controllers/chapterController.js';

const router = express.Router();

// Apply authentication middleware to all chapter routes
router.use(authenticateToken);

// Chapter routes
router.get('/books/:bookId/chapters', getBookChapters);
router.get('/chapters/:chapterId', getChapter);
router.post('/books/:bookId/chapters', createChapter);
router.put('/chapters/:chapterId', updateChapter);
router.delete('/chapters/:chapterId', deleteChapter);
router.put('/books/:bookId/chapters/reorder', reorderChapters);

export default router;
