import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);

// TODO: Implement user management endpoints
router.get('/profile', (req, res) => {
  res.json({ message: 'User profile endpoint - to be implemented' });
});

router.put('/profile', (req, res) => {
  res.json({ message: 'Update profile endpoint - to be implemented' });
});

router.delete('/account', (req, res) => {
  res.json({ message: 'Delete account endpoint - to be implemented' });
});

export default router; 