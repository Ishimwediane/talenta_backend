import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireAdmin, requireAdminOrModerator } from '../middleware/admin.middleware.js';
import {
  getAllUsers,
  getUserStats,
  getUserById,
  updateUser,
  deleteUser,
  getUserContent
} from '../controllers/admin.controller.js';

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// User Management Routes
router.get('/users', requireAdmin, getAllUsers);
router.get('/users/stats', requireAdmin, getUserStats);
router.get('/users/:id', requireAdmin, getUserById);
router.put('/users/:id', requireAdmin, updateUser);
router.delete('/users/:id', requireAdmin, deleteUser);
router.get('/users/:id/content', requireAdmin, getUserContent);

export default router;
