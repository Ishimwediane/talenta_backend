import prisma from '../lib/prisma.js';

/**
 * Get all chapters for a book
 */
export const getBookChapters = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { includeUnpublished = false } = req.query;

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true, isCollaborative: true, allowChapterContributions: true }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Build where clause for chapters
    const where = { bookId };
    if (!includeUnpublished) {
      where.isPublished = true;
    }

    const chapters = await prisma.chapter.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.json({
      success: true,
      data: {
        book,
        chapters
      }
    });
  } catch (error) {
    console.error('Error fetching book chapters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chapters',
      error: error.message
    });
  }
};

/**
 * Get a specific chapter
 */
export const getChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            isCollaborative: true,
            allowChapterContributions: true
          }
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true
          }
        }
      }
    });

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    res.json({
      success: true,
      data: chapter
    });
  } catch (error) {
    console.error('Error fetching chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chapter',
      error: error.message
    });
  }
};

/**
 * Create a new chapter
 */
export const createChapter = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, content, order } = req.body;
    const userId = req.user.id;

    // Check if book exists and user has permission
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        contributors: {
          where: {
            userId: userId,
            status: 'APPROVED'
          }
        }
      }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check permissions
    const isBookOwner = book.userId === userId;
    const isApprovedContributor = book.contributors.length > 0;
    const canContribute = book.allowChapterContributions && (isBookOwner || isApprovedContributor);

    if (!canContribute) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add chapters to this book'
      });
    }

    // Get the next chapter order if not provided
    let chapterOrder = order;
    if (!chapterOrder) {
      const lastChapter = await prisma.chapter.findFirst({
        where: { bookId },
        orderBy: { order: 'desc' }
      });
      chapterOrder = lastChapter ? lastChapter.order + 1 : 1;
    }

    // Check if order already exists
    const existingChapter = await prisma.chapter.findUnique({
      where: {
        bookId_order: {
          bookId,
          order: chapterOrder
        }
      }
    });

    if (existingChapter) {
      return res.status(400).json({
        success: false,
        message: 'A chapter with this order already exists'
      });
    }

    // Calculate word count
    const wordCount = content ? content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
    const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute

    const chapter = await prisma.chapter.create({
      data: {
        title,
        content,
        order: chapterOrder,
        bookId,
        authorId: userId,
        wordCount,
        readingTime
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Chapter created successfully',
      data: chapter
    });
  } catch (error) {
    console.error('Error creating chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chapter',
      error: error.message
    });
  }
};

/**
 * Update a chapter
 */
export const updateChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { title, content, order, status, isPublished } = req.body;
    const userId = req.user.id;

    // Check if chapter exists and user has permission
    const existingChapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        book: {
          include: {
            contributors: {
              where: {
                userId: userId,
                status: 'APPROVED'
              }
            }
          }
        }
      }
    });

    if (!existingChapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Check permissions
    const isBookOwner = existingChapter.book.userId === userId;
    const isChapterAuthor = existingChapter.authorId === userId;
    const isApprovedContributor = existingChapter.book.contributors.length > 0;
    const canEdit = isBookOwner || isChapterAuthor || isApprovedContributor;

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this chapter'
      });
    }

    // If changing order, check for conflicts
    if (order && order !== existingChapter.order) {
      const conflictingChapter = await prisma.chapter.findUnique({
        where: {
          bookId_order: {
            bookId: existingChapter.bookId,
            order: order
          }
        }
      });

      if (conflictingChapter) {
        return res.status(400).json({
          success: false,
          message: 'A chapter with this order already exists'
        });
      }
    }

    // Calculate word count if content is being updated
    let updateData = { title, content, order, status, isPublished };
    if (content) {
      const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);
      updateData.wordCount = wordCount;
      updateData.readingTime = readingTime;
    }

    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Chapter updated successfully',
      data: chapter
    });
  } catch (error) {
    console.error('Error updating chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chapter',
      error: error.message
    });
  }
};

/**
 * Delete a chapter
 */
export const deleteChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user.id;

    // Check if chapter exists and user has permission
    const existingChapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        book: {
          include: {
            contributors: {
              where: {
                userId: userId,
                status: 'APPROVED'
              }
            }
          }
        }
      }
    });

    if (!existingChapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Check permissions
    const isBookOwner = existingChapter.book.userId === userId;
    const isChapterAuthor = existingChapter.authorId === userId;
    const canDelete = isBookOwner || isChapterAuthor;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this chapter'
      });
    }

    await prisma.chapter.delete({
      where: { id: chapterId }
    });

    res.json({
      success: true,
      message: 'Chapter deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chapter',
      error: error.message
    });
  }
};

/**
 * Reorder chapters
 */
export const reorderChapters = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { chapterOrders } = req.body; // Array of { chapterId, order }
    const userId = req.user.id;

    // Check if book exists and user has permission
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        contributors: {
          where: {
            userId: userId,
            status: 'APPROVED'
          }
        }
      }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check permissions
    const isBookOwner = book.userId === userId;
    const isApprovedContributor = book.contributors.length > 0;
    const canReorder = isBookOwner || isApprovedContributor;

    if (!canReorder) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to reorder chapters'
      });
    }

    // Update chapter orders in a transaction
    await prisma.$transaction(
      chapterOrders.map(({ chapterId, order }) =>
        prisma.chapter.update({
          where: { id: chapterId },
          data: { order }
        })
      )
    );

    res.json({
      success: true,
      message: 'Chapters reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering chapters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder chapters',
      error: error.message
    });
  }
};
