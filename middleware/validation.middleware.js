import { body, param, query } from 'express-validator';

export const validateRegister = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-\(\)]{10,}$/)
    .withMessage('Please enter a valid phone number'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),

  // Ensure either email or phone is provided
  body()
    .custom((value, { req }) => {
      if (!req.body.email && !req.body.phone) {
        throw new Error('Either email or phone number is required');
      }
      return true;
    })
];

export const validateLogin = [
  body('emailOrPhone')
    .trim()
    .notEmpty()
    .withMessage('Email or phone number is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const validateForgotPassword = [
  body('emailOrPhone')
    .trim()
    .notEmpty()
    .withMessage('Email or phone number is required')
];

export const validateResetPassword = [
  param('token')
    .notEmpty()
    .withMessage('Reset token is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

export const validateEmailVerification = [
  param('token')
    .notEmpty()
    .withMessage('Verification token is required')
];

export const validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please enter a valid date'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Please select a valid gender'),

  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),

  body('interests.*')
    .optional()
    .isIn(['film', 'poetry', 'podcast', 'music', 'photography', 'art', 'technology', 'education', 'social-commentary', 'entertainment'])
    .withMessage('Please select valid interests'),

  body('socialLinks.instagram')
    .optional()
    .isURL()
    .withMessage('Please enter a valid Instagram URL'),

  body('socialLinks.twitter')
    .optional()
    .isURL()
    .withMessage('Please enter a valid Twitter URL'),

  body('socialLinks.facebook')
    .optional()
    .isURL()
    .withMessage('Please enter a valid Facebook URL'),

  body('socialLinks.youtube')
    .optional()
    .isURL()
    .withMessage('Please enter a valid YouTube URL'),

  body('socialLinks.tiktok')
    .optional()
    .isURL()
    .withMessage('Please enter a valid TikTok URL')
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sort')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email'])
    .withMessage('Invalid sort field'),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either asc or desc')
]; 