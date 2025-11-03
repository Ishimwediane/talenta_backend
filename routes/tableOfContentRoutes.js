// routes/tableOfContentRoutes.js

import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { tryAuthenticateToken } from '../middleware/tryAuthenticateToken.js';
import {
  getTableOfContents,
  createTableOfContentEntry,
  updateTableOfContentEntry,
  deleteTableOfContentEntry,
  reorderTableOfContents
} from '../controllers/tableOfContentController.js';

const router = express.Router();

// Public route - allow reading table of contents without authentication
router.get('/books/:bookId/table-of-contents', tryAuthenticateToken, getTableOfContents);

// Protected routes - require authentication for creating/updating/deleting
router.post('/books/:bookId/table-of-contents', authenticateToken, createTableOfContentEntry);
router.put('/table-of-contents/:entryId', authenticateToken, updateTableOfContentEntry);
router.delete('/table-of-contents/:entryId', authenticateToken, deleteTableOfContentEntry);
router.post('/books/:bookId/table-of-contents/reorder', authenticateToken, reorderTableOfContents);

export default router;
