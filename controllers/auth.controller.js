import { validationResult } from 'express-validator';
import authService from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.error(res, 'Validation failed', errors.array(), 400);
      }

      const { firstName, lastName, email, phone, password, role } = req.body;

      // Determine if using email or phone
      const userData = {
        firstName,
        lastName,
        password,
         ...(email && { email }),
        ...(phone && { phone })
      };

      if (email) {
        userData.email = email;
      } else if (phone) {
        userData.phone = phone;
      }

      const result = await authService.register(userData);

      return ApiResponse.success(res, result.message, {
        user: result.user,
        token: result.token
      }, 201);
    } catch (error) {
      console.error('Registration error:', error);
      return ApiResponse.error(res, error.message, null, 400);
    }
  }

  // Login user
  async login(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.error(res, 'Validation failed', errors.array(), 400);
      }

      const { emailOrPhone, password } = req.body;

      const result = await authService.login({ emailOrPhone, password });

      return ApiResponse.success(res, result.message, {
        user: result.user,
        token: result.token
      });
    } catch (error) {
      console.error('Login error:', error);
      return ApiResponse.error(res, error.message, null, 401);
    }
  }

  // Verify email
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      const result = await authService.verifyEmail(token);

      return ApiResponse.success(res, result.message);
    } catch (error) {
      console.error('Email verification error:', error);
      return ApiResponse.error(res, error.message, null, 400);
    }
  }

  // Forgot password
  async forgotPassword(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.error(res, 'Validation failed', errors.array(), 400);
      }

      const { emailOrPhone } = req.body;

      const result = await authService.forgotPassword(emailOrPhone);

      return ApiResponse.success(res, result.message);
    } catch (error) {
      console.error('Forgot password error:', error);
      return ApiResponse.error(res, error.message, null, 400);
    }
  }

  // Reset password
  async resetPassword(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.error(res, 'Validation failed', errors.array(), 400);
      }

      const { token } = req.params;
      const { newPassword } = req.body;

      const result = await authService.resetPassword(token, newPassword);

      return ApiResponse.success(res, result.message);
    } catch (error) {
      console.error('Reset password error:', error);
      return ApiResponse.error(res, error.message, null, 400);
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const userId = req.user.id;

      const result = await authService.refreshToken(userId);

      return ApiResponse.success(res, result.message, {
        token: result.token
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      return ApiResponse.error(res, error.message, null, 401);
    }
  }

  // Logout
  async logout(req, res) {
    try {
      const userId = req.user.id;

      const result = await authService.logout(userId);

      return ApiResponse.success(res, result.message);
    } catch (error) {
      console.error('Logout error:', error);
      return ApiResponse.error(res, error.message, null, 500);
    }
  }

  // Get current user
  async getCurrentUser(req, res) {
    try {
      const userId = req.user.id;

      const user = await authService.getCurrentUser(userId);

      return ApiResponse.success(res, 'User retrieved successfully', { user });
    } catch (error) {
      console.error('Get current user error:', error);
      return ApiResponse.error(res, error.message, null, 404);
    }
  }

  // Google OAuth login
  async googleLogin(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return ApiResponse.error(res, 'Google token is required', null, 400);
      }

      const googleAuthService = await import('../services/googleAuth.service.js');
      const result = await googleAuthService.default.authenticateWithGoogle(token);

      return ApiResponse.success(res, result.message, {
        user: result.user,
        token: result.token
      });
    } catch (error) {
      console.error('Google login error:', error);
      return ApiResponse.error(res, error.message, null, 400);
    }
  }

  // Facebook OAuth login (placeholder for future implementation)
  async facebookLogin(req, res) {
    try {
      // TODO: Implement Facebook OAuth
      return ApiResponse.error(res, 'Facebook OAuth not implemented yet', null, 501);
    } catch (error) {
      console.error('Facebook login error:', error);
      return ApiResponse.error(res, error.message, null, 500);
    }
  }

  // Phone verification (placeholder for future implementation)
  async verifyPhone(req, res) {
    try {
      // TODO: Implement phone verification
      return ApiResponse.error(res, 'Phone verification not implemented yet', null, 501);
    } catch (error) {
      console.error('Phone verification error:', error);
      return ApiResponse.error(res, error.message, null, 500);
    }
  }

  // Send verification code (placeholder for future implementation)
  async sendVerificationCode(req, res) {
    try {
      // TODO: Implement SMS verification
      return ApiResponse.error(res, 'SMS verification not implemented yet', null, 501);
    } catch (error) {
      console.error('Send verification code error:', error);
      return ApiResponse.error(res, error.message, null, 500);
    }
  }
}

export default new AuthController(); 