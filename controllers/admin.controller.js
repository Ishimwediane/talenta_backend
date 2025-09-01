import prisma from '../lib/prisma.js';

/**
 * Get all users with pagination, search, and filtering
 */
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Role filter
    if (role && role !== 'all') {
      where.role = role;
    }

    // Status filter
    if (status && status !== 'all') {
      switch (status) {
        case 'active':
          where.isActive = true;
          break;
        case 'inactive':
          where.isActive = false;
          break;
        case 'verified':
          where.isVerified = true;
          break;
        case 'unverified':
          where.isVerified = false;
          break;
      }
    }

    // Get users with content counts
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          isActive: true,
          bio: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          profilePicture: true,
          _count: {
            select: {
              books: true,
              audio: true,
              contents: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      creators,
      moderators,
      admins
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { role: 'CREATOR' } }),
      prisma.user.count({ where: { role: 'MODERATOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        creators,
        moderators,
        admins
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};

/**
 * Get specific user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        isActive: true,
        bio: true,
        location: true,
        dateOfBirth: true,
        gender: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        _count: {
          select: {
            books: true,
            audio: true,
            contents: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

/**
 * Update user details
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      bio,
      location,
      role,
      isVerified,
      isActive
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from modifying other admins
    if (existingUser.role === 'ADMIN' && req.adminUser.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify other admin accounts'
      });
    }

    // Validate role changes
    if (role && !['USER', 'CREATOR', 'MODERATOR', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Check email uniqueness if email is being updated
    if (email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id }
        }
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Check phone uniqueness if phone is being updated
    if (phone) {
      const phoneExists = await prisma.user.findFirst({
        where: {
          phone,
          id: { not: id }
        }
      });

      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists'
        });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(role && { role }),
        ...(isVerified !== undefined && { isVerified }),
        ...(isActive !== undefined && { isActive })
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        isActive: true,
        bio: true,
        location: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, firstName: true, lastName: true }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deletion of admin accounts
    if (existingUser.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin accounts'
      });
    }

    // Prevent self-deletion
    if (req.adminUser.id === id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: `User ${existingUser.firstName} ${existingUser.lastName} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

/**
 * Get user content (books, audio, other content)
 */
export const getUserContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'all' } = req.query;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const contentData = {};

    // Get books
    if (type === 'all' || type === 'books') {
      contentData.books = await prisma.book.findMany({
        where: { userId: id },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          category: true,
          subCategories: true,
          createdAt: true,
          updatedAt: true,
          coverImage: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Get audio
    if (type === 'all' || type === 'audio') {
      contentData.audio = await prisma.audio.findMany({
        where: { userId: id },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          category: true,
          subCategories: true,
          totalDuration: true,
          createdAt: true,
          fileUrl: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Get other content
    if (type === 'all' || type === 'content') {
      contentData.contents = await prisma.content.findMany({
        where: { userId: id },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          category: true,
          tags: true,
          isPublished: true,
          isApproved: true,
          views: true,
          likes: true,
          shares: true,
          createdAt: true,
          updatedAt: true,
          thumbnailUrl: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName
        },
        ...contentData
      }
    });
  } catch (error) {
    console.error('Error fetching user content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user content',
      error: error.message
    });
  }
};
