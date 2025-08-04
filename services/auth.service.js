import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';

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

  // Increment login attempts
  async incrementLoginAttempts(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user.lockUntil && user.lockUntil < new Date()) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lockUntil: null,
          loginAttempts: 1
        }
      });
    } else {
      const newLoginAttempts = user.loginAttempts + 1;
      const updates = { loginAttempts: newLoginAttempts };
      
      if (newLoginAttempts >= 5) {
        updates.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      }
      
      await prisma.user.update({
        where: { id: userId },
        data: updates
      });
    }
  }

  // Register new user
  async register(userData) {
    try {
      const { email, phone, password, firstName, lastName } = userData;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email?.toLowerCase() },
            { phone: phone }
          ].filter(Boolean)
        }
      });

      if (existingUser) {
        throw new Error('User with this email or phone number already exists');
      }

      // Generate verification token
      const { token: verificationToken, expires: verificationTokenExpires } = this.generateVerificationToken();

      // Hash password
      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email: email?.toLowerCase(),
          phone,
          password: hashedPassword,
          verificationToken,
          verificationTokenExpires,
          earnings: {
            create: {}
          },
          stats: {
            create: {}
          }
        },
        include: {
          earnings: true,
          stats: true
        }
      });

      // Generate JWT token
      const jwtToken = this.generateToken(user.id);

      // Return user data without sensitive information
      const userResponse = {
        id: user.id,
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
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: emailOrPhone },
            { phone: emailOrPhone }
          ]
        },
        include: {
          earnings: true,
          stats: true,
          socialLinks: true
        }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (user.lockUntil && user.lockUntil > new Date()) {
        throw new Error('Account is temporarily locked. Please try again later.');
      }

      // Check if account is active
      if (!user.isActive) {
        throw new Error('Account is deactivated. Please contact support.');
      }

      // Verify password
      const bcrypt = await import('bcryptjs');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await this.incrementLoginAttempts(user.id);
        throw new Error('Invalid credentials');
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lockUntil: null,
            loginAttempts: 0,
            lastLogin: new Date()
          }
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });
      }

      // Generate JWT token
      const token = this.generateToken(user.id);

      // Return user data
      const userResponse = {
        id: user.id,
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
      const user = await prisma.user.findFirst({
        where: {
          verificationToken: token,
          verificationTokenExpires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null,
          verificationTokenExpires: null
        }
      });

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
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: emailOrPhone },
            { phone: emailOrPhone }
          ]
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const { token: resetToken, expires: resetExpires } = this.generateResetPasswordToken();

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires
        }
      });

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
      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null
        }
      });

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
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      const token = this.generateToken(user.id);

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
      await prisma.user.update({
        where: { id: userId },
        data: { lastLogin: new Date() }
      });

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
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          earnings: true,
          stats: true,
          socialLinks: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      return {
        id: user.id,
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
        isVerified: user.isVerified,
        role: user.role,
        socialLinks: user.socialLinks,
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