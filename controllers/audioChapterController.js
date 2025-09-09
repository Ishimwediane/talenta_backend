import prisma from '../lib/prisma.js';

// @desc Create a new audio chapter
export const createAudioChapter = async (req, res) => {
  try {
    const { audioId } = req.params;
    const { title, description, order, status, duration, wordCount } = req.body;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    // Check if audio exists and belongs to user
    const audio = await prisma.audio.findUnique({
      where: { id: audioId }
    });

    if (!audio) {
      return res.status(404).json({ error: "Audio not found." });
    }

    if (audio.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only create chapters for your own audio." });
    }

    // Get the next chapter order if not provided
    let chapterOrder = order;
    if (!chapterOrder) {
      const existingChapters = await prisma.audioChapter.findMany({
        where: { audioId },
        orderBy: { order: 'asc' },
        select: { order: true }
      });
      const existingOrders = existingChapters.map(c => c.order);
      let nextOrder = 1;
      for (let i = 0; i < existingOrders.length; i++) {
        if (existingOrders[i] !== i + 1) {
          nextOrder = i + 1;
          break;
        }
        nextOrder = i + 2; // If no gap, next order is after the last
      }
      chapterOrder = nextOrder;
    } else {
      // If an order is provided, ensure it's the next sequential one
      const lastChapter = await prisma.audioChapter.findFirst({
        where: { audioId },
        orderBy: { order: 'desc' }
      });
      const expectedNextOrder = lastChapter ? lastChapter.order + 1 : 1;
      if (order !== expectedNextOrder) {
        return res.status(400).json({
          success: false,
          message: `The next chapter must be order ${expectedNextOrder}. You cannot skip orders.`
        });
      }
    }

    // Validate status
    const chapterStatus = status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

    const chapter = await prisma.audioChapter.create({
      data: {
        title,
        description: description || null,
        order: chapterOrder,
        status: chapterStatus,
        duration: duration || null,
        wordCount: wordCount || null,
        audioId,
        authorId: req.user.id
      },
      include: {
        audio: {
          select: {
            id: true,
            title: true
          }
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log('✅ Audio chapter created successfully:', chapter.id);
    res.status(201).json({
      success: true,
      message: "Audio chapter created successfully",
      chapter
    });
  } catch (error) {
    console.error("🔥 createAudioChapter error:", error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: "A chapter with this order already exists for this audio."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create audio chapter",
      error: error.message
    });
  }
};

// @desc Get all chapters for an audio
export const getAudioChapters = async (req, res) => {
  try {
    const { audioId } = req.params;
    const { includeUnpublished = false } = req.query;

    // Check if audio exists
    const audio = await prisma.audio.findUnique({
      where: { id: audioId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: "Audio not found"
      });
    }

    // Build where clause
    const whereClause = { audioId };
    if (!includeUnpublished) {
      whereClause.status = 'PUBLISHED';
    }

    // If not including unpublished and user is not the owner, only show published
    if (!includeUnpublished && (!req.user || req.user.id !== audio.userId)) {
      whereClause.status = 'PUBLISHED';
    }

    const chapters = await prisma.audioChapter.findMany({
      where: whereClause,
      orderBy: { order: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        parts: {
          where: includeUnpublished ? {} : { status: 'PUBLISHED' },
          orderBy: { order: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      chapters,
      audio
    });
  } catch (error) {
    console.error("🔥 getAudioChapters error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audio chapters",
      error: error.message
    });
  }
};

// @desc Get a specific audio chapter
export const getAudioChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;

    const chapter = await prisma.audioChapter.findUnique({
      where: { id: chapterId },
      include: {
        audio: {
          select: {
            id: true,
            title: true,
            userId: true
          }
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        parts: {
          orderBy: { order: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Audio chapter not found"
      });
    }

    // Check access permissions
    if (chapter.audio.userId !== req.user?.id && chapter.status !== 'PUBLISHED') {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this chapter"
      });
    }

    res.status(200).json({
      success: true,
      chapter
    });
  } catch (error) {
    console.error("🔥 getAudioChapter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audio chapter",
      error: error.message
    });
  }
};

// @desc Update an audio chapter
export const updateAudioChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { title, description, order, status, duration, wordCount } = req.body;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    // Check if chapter exists and belongs to user
    const existingChapter = await prisma.audioChapter.findUnique({
      where: { id: chapterId },
      include: {
        audio: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    });

    if (!existingChapter) {
      return res.status(404).json({ error: "Audio chapter not found." });
    }

    if (existingChapter.audio.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only update your own audio chapters." });
    }

    // If order is being changed, validate it's sequential
    if (order !== undefined && order !== existingChapter.order) {
      const otherChapters = await prisma.audioChapter.findMany({
        where: { 
          audioId: existingChapter.audio.id,
          id: { not: chapterId }
        },
        orderBy: { order: 'asc' },
        select: { order: true }
      });

      // Check if the new order would create gaps
      const allOrders = [...otherChapters.map(c => c.order), order].sort((a, b) => a - b);
      for (let i = 0; i < allOrders.length; i++) {
        if (allOrders[i] !== i + 1) {
          return res.status(400).json({
            success: false,
            message: "Chapter orders must be sequential without gaps."
          });
        }
      }
    }

    // Validate status
    const chapterStatus = status === 'PUBLISHED' ? 'PUBLISHED' : 
                         status === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT';

    const updatedChapter = await prisma.audioChapter.update({
      where: { id: chapterId },
      data: {
        title: title !== undefined ? title : existingChapter.title,
        description: description !== undefined ? description : existingChapter.description,
        order: order !== undefined ? order : existingChapter.order,
        status: chapterStatus,
        duration: duration !== undefined ? duration : existingChapter.duration,
        wordCount: wordCount !== undefined ? wordCount : existingChapter.wordCount
      },
      include: {
        audio: {
          select: {
            id: true,
            title: true
          }
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log('✅ Audio chapter updated successfully:', updatedChapter.id);
    res.status(200).json({
      success: true,
      message: "Audio chapter updated successfully",
      chapter: updatedChapter
    });
  } catch (error) {
    console.error("🔥 updateAudioChapter error:", error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: "A chapter with this order already exists for this audio."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to update audio chapter",
      error: error.message
    });
  }
};

// @desc Delete an audio chapter
export const deleteAudioChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    // Check if chapter exists and belongs to user
    const existingChapter = await prisma.audioChapter.findUnique({
      where: { id: chapterId },
      include: {
        audio: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    });

    if (!existingChapter) {
      return res.status(404).json({ error: "Audio chapter not found." });
    }

    if (existingChapter.audio.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own audio chapters." });
    }

    // Delete the chapter (this will cascade delete all parts)
    await prisma.audioChapter.delete({
      where: { id: chapterId }
    });

    console.log('✅ Audio chapter deleted successfully:', chapterId);
    res.status(200).json({
      success: true,
      message: "Audio chapter deleted successfully"
    });
  } catch (error) {
    console.error("🔥 deleteAudioChapter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete audio chapter",
      error: error.message
    });
  }
};

// @desc Reorder audio chapters
export const reorderAudioChapters = async (req, res) => {
  try {
    const { audioId } = req.params;
    const { chapterOrders } = req.body; // Array of { id, order }

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    // Check if audio exists and belongs to user
    const audio = await prisma.audio.findUnique({
      where: { id: audioId }
    });

    if (!audio) {
      return res.status(404).json({ error: "Audio not found." });
    }

    if (audio.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only reorder chapters for your own audio." });
    }

    // Validate that all chapters belong to this audio
    const chapterIds = chapterOrders.map(co => co.id);
    const chapters = await prisma.audioChapter.findMany({
      where: { 
        id: { in: chapterIds },
        audioId 
      }
    });

    if (chapters.length !== chapterIds.length) {
      return res.status(400).json({ error: "Some chapters do not belong to this audio." });
    }

    // Update all chapters with new orders
    const updatePromises = chapterOrders.map(({ id, order }) =>
      prisma.audioChapter.update({
        where: { id },
        data: { order }
      })
    );

    await Promise.all(updatePromises);

    // Fetch updated chapters
    const updatedChapters = await prisma.audioChapter.findMany({
      where: { audioId },
      orderBy: { order: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log('✅ Audio chapters reordered successfully');
    res.status(200).json({
      success: true,
      message: "Audio chapters reordered successfully",
      chapters: updatedChapters
    });
  } catch (error) {
    console.error("🔥 reorderAudioChapters error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder audio chapters",
      error: error.message
    });
  }
};







