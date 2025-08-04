import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

class GoogleAuthService {
  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
  }

  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }

  async verifyGoogleToken(token) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      return {
        googleId: payload.sub,
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        profilePicture: payload.picture,
        emailVerified: payload.email_verified
      };
    } catch (error) {
      throw new Error('Invalid Google token');
    }
  }

  async authenticateWithGoogle(token) {
    try {
      const googleUser = await this.verifyGoogleToken(token);
      
      // Check if user already exists
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: googleUser.email },
            { googleId: googleUser.googleId }
          ]
        },
        include: {
          earnings: true,
          stats: true,
          socialLinks: true
        }
      });

      if (user) {
        // Update user with Google info if needed
        if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: googleUser.googleId,
              profilePicture: googleUser.profilePicture,
              isVerified: googleUser.emailVerified
            },
            include: {
              earnings: true,
              stats: true,
              socialLinks: true
            }
          });
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            email: googleUser.email,
            googleId: googleUser.googleId,
            profilePicture: googleUser.profilePicture,
            isVerified: googleUser.emailVerified,
            password: '', // Empty password for OAuth users
            earnings: { create: {} },
            stats: { create: {} }
          },
          include: {
            earnings: true,
            stats: true,
            socialLinks: true
          }
        });
      }

      const jwtToken = this.generateToken(user.id);
      
      const userResponse = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        googleId: user.googleId,
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
        token: jwtToken,
        message: 'Google authentication successful'
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new GoogleAuthService(); 