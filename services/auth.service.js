import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model.js';

class AuthService {
  // Generate JWT token
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Generate verification token
  generateVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return { token, expires };
  }

  // Generate reset password token
  generateResetPasswordToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return { token, expires };
  }

  // Register new user
  async register(userData) {
    try {
      const { email, phone, password, firstName, lastName } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email?.toLowerCase() },
          { phone: phone }
        ].filter(Boolean)
      });

      if (existingUser) {
        throw new Error('User with this email or phone number already exists');
      }

      // Generate verification token
      const { token: verificationToken, expires: verificationTokenExpires } = this.generateVerificationToken();

      // Create new user
      const user = new User({
        firstName,
        lastName,
        email: email?.toLowerCase(),
        phone,
        password,
        verificationToken,
        verificationTokenExpires
      });

      await user.save();

      // Generate JWT token
      const jwtToken = this.generateToken(user._id);

      // Return user data without sensitive information
      const userResponse = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        role: user.role,
        createdAt: user.createdAt
      };

      return {
        user: userResponse,
        token: jwtToken,
        message: 'Registration successful. Please verify your email.'
      };
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async login(credentials) {
    try {
      const { emailOrPhone, password } = credentials;

      // Find user by email or phone
      const user = await User.findByEmailOrPhone(emailOrPhone).select('+password');

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (user.isLocked) {
        throw new Error('Account is temporarily locked. Please try again later.');
      }

      // Check if account is active
      if (!user.isActive) {
        throw new Error('Account is deactivated. Please contact support.');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        await user.incLoginAttempts();
        throw new Error('Invalid credentials');
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await User.updateOne(
          { _id: user._id },
          { 
            $unset: { lockUntil: 1, loginAttempts: 1 },
            $set: { lastLogin: new Date() }
          }
        );
      } else {
        await User.updateOne(
          { _id: user._id },
          { lastLogin: new Date() }
        );
      }

      // Generate JWT token
      const token = this.generateToken(user._id);

      // Return user data
      const userResponse = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location,
        isVerified: user.isVerified,
        role: user.role,
        interests: user.interests,
        socialLinks: user.socialLinks,
        earnings: user.earnings,
        stats: user.stats,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      };

      return {
        user: userResponse,
        token,
        message: 'Login successful'
      };
    } catch (error) {
      throw error;
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      await user.save();

      return {
        message: 'Email verified successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Forgot password
  async forgotPassword(emailOrPhone) {
    try {
      const user = await User.findByEmailOrPhone(emailOrPhone);

      if (!user) {
        throw new Error('User not found');
      }

      const { token: resetToken, expires: resetExpires } = this.generateResetPasswordToken();

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetExpires;
      await user.save();

      // TODO: Send email/SMS with reset token
      console.log('Reset token:', resetToken);

      return {
        message: 'Password reset instructions sent to your email/phone'
      };
    } catch (error) {
      throw error;
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return {
        message: 'Password reset successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Refresh token
  async refreshToken(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      const token = this.generateToken(user._id);

      return {
        token,
        message: 'Token refreshed successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Logout (client-side token removal)
  async logout(userId) {
    try {
      // Update last login time
      await User.updateOne(
        { _id: userId },
        { lastLogin: new Date() }
      );

      return {
        message: 'Logged out successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // Get current user
  async getCurrentUser(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      return {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        interests: user.interests,
        socialLinks: user.socialLinks,
        isVerified: user.isVerified,
        role: user.role,
        earnings: user.earnings,
        stats: user.stats,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthService(); 