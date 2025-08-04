import express from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticateToken, requireVerified } from '../middleware/auth.middleware.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateEmailVerification
} from '../middleware/validation.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password/:token', validateResetPassword, authController.resetPassword);
router.get('/verify-email/:token', validateEmailVerification, authController.verifyEmail);

// OAuth routes (placeholders for future implementation)
router.post('/google', authController.googleLogin);
router.post('/facebook', authController.facebookLogin);

// Phone verification routes (placeholders for future implementation)
router.post('/send-verification-code', authController.sendVerificationCode);
router.post('/verify-phone', authController.verifyPhone);

// Protected routes
router.use(authenticateToken); // Apply authentication middleware to all routes below

router.get('/me', authController.getCurrentUser);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

export default router; 