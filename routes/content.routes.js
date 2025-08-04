import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all content routes
router.use(authenticateToken);

// TODO: Implement content management endpoints
router.get('/', (req, res) => {
  res.json({ message: 'Get all content endpoint - to be implemented' });
});

router.post('/upload', (req, res) => {
  res.json({ message: 'Upload content endpoint - to be implemented' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get content by ID endpoint - to be implemented' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update content endpoint - to be implemented' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete content endpoint - to be implemented' });
});

export default router; 