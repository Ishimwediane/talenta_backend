// routes/tableOfContentRoutes.js

import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  getTableOfContents,
  createTableOfContentEntry,
  updateTableOfContentEntry,
  deleteTableOfContentEntry,
  reorderTableOfContents
} from '../controllers/tableOfContentController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET table of contents for a book
router.get('/books/:bookId/table-of-contents', getTableOfContents);

// POST create a new table of contents entry
router.post('/books/:bookId/table-of-contents', createTableOfContentEntry);

// PUT update a table of contents entry
router.put('/table-of-contents/:entryId', updateTableOfContentEntry);

// DELETE a table of contents entry
router.delete('/table-of-contents/:entryId', deleteTableOfContentEntry);

// POST reorder table of contents entries
router.post('/books/:bookId/table-of-contents/reorder', reorderTableOfContents);

export default router;
