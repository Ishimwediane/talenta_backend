import express from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory
} from '../controllers/categoryController.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin routes (require authentication and admin role)
router.post('/', authenticateToken, requireAdmin, createCategory);
router.put('/:id', authenticateToken, requireAdmin, updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, deleteCategory);

// Subcategory routes
router.post('/subcategories', authenticateToken, requireAdmin, createSubCategory);
router.put('/subcategories/:id', authenticateToken, requireAdmin, updateSubCategory);
router.delete('/subcategories/:id', authenticateToken, requireAdmin, deleteSubCategory);

export default router;
