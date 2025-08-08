import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { uploadBook, getAllBooks, getBookById } from '../controllers/bookController.js';

const router = express.Router();

router.post(
  '/',
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'bookFile', maxCount: 1 }
  ]),
  uploadBook
);
router.get('/', getAllBooks);
router.get('/:id', getBookById);

export default router;
