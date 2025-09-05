import prisma from '../lib/prisma.js';

// @desc Create a new audio part
export const createAudioPart = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { title, description, order, status, fileName, publicId, fileUrl, duration } = req.body;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    // Check if chapter exists and belongs to user
    const chapter = await prisma.audioChapter.findUnique({
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

    if (!chapter) {
      return res.status(404).json({ error: "Audio chapter not found." });
    }

    if (chapter.audio.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only create parts for your own audio chapters." });
    }

    // Get the next part order if not provided
    let partOrder = order;
    if (!partOrder) {
      const existingParts = await prisma.audioPart.findMany({
        where: { chapterId },
        orderBy: { order: 'asc' },
        select: { order: true }
      });
      const existingOrders = existingParts.map(p => p.order);
      let nextOrder = 1;
      for (let i = 0; i < existingOrders.length; i++) {
        if (existingOrders[i] !== i + 1) {
          nextOrder = i + 1;
          break;
        }
        nextOrder = i + 2; // If no gap, next order is after the last
      }
      partOrder = nextOrder;
    } else {
      // If an order is provided, ensure it's the next sequential one
      const lastPart = await prisma.audioPart.findFirst({
        where: { chapterId },
        orderBy: { order: 'desc' }
      });
      const expectedNextOrder = lastPart ? lastPart.order + 1 : 1;
      if (order !== expectedNextOrder) {
        return res.status(400).json({
          success: false,
          message: `The next part must be order ${expectedNextOrder}. You cannot skip orders.`
        });
      }
    }

    // Validate status
    const partStatus = status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

    const part = await prisma.audioPart.create({
      data: {
        title: title || null,
        description: description || null,
        order: partOrder,
        status: partStatus,
        fileName,
        publicId: publicId || null,
        fileUrl,
        duration: duration || null,
        chapterId,
        authorId: req.user.id
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            audio: {
              select: {
                id: true,
                title: true
              }
            }
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

    console.log('✅ Audio part created successfully:', part.id);
    res.status(201).json({
      success: true,
      message: "Audio part created successfully",
      part
    });
  } catch (error) {
    console.error("🔥 createAudioPart error:", error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: "A part with this order already exists for this chapter."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create audio part",
      error: error.message
    });
  }
};

// @desc Get all parts for an audio chapter
export const getAudioParts = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { includeUnpublished = false } = req.query;

    // Check if chapter exists
    const chapter = await prisma.audioChapter.findUnique({
      where: { id: chapterId },
      include: {
        audio: {
          select: {
            id: true,
            title: true,
            userId: true
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

    // Build where clause
    const whereClause = { chapterId };
    if (!includeUnpublished) {
      whereClause.status = 'PUBLISHED';
    }

    // If not including unpublished and user is not the owner, only show published
    if (!includeUnpublished && (!req.user || req.user.id !== chapter.audio.userId)) {
      whereClause.status = 'PUBLISHED';
    }

    const parts = await prisma.audioPart.findMany({
      where: whereClause,
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

    res.status(200).json({
      success: true,
      parts,
      chapter
    });
  } catch (error) {
    console.error("🔥 getAudioParts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audio parts",
      error: error.message
    });
  }
};

// @desc Get a specific audio part
export const getAudioPart = async (req, res) => {
  try {
    const { partId } = req.params;

    const part = await prisma.audioPart.findUnique({
      where: { id: partId },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            audio: {
              select: {
                id: true,
                title: true,
                userId: true
              }
            }
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

    if (!part) {
      return res.status(404).json({
        success: false,
        message: "Audio part not found"
      });
    }

    // Check access permissions
    if (part.chapter.audio.userId !== req.user?.id && part.status !== 'PUBLISHED') {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this part"
      });
    }

    res.status(200).json({
      success: true,
      part
    });
  } catch (error) {
    console.error("🔥 getAudioPart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audio part",
      error: error.message
    });
  }
};

// @desc Update an audio part
export const updateAudioPart = async (req, res) => {
  try {
    const { partId } = req.params;
    const { title, description, order, status, fileName, publicId, fileUrl, duration } = req.body;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    // Check if part exists and belongs to user
    const existingPart = await prisma.audioPart.findUnique({
      where: { id: partId },
      include: {
        chapter: {
          select: {
            id: true,
            audio: {
              select: {
                id: true,
                userId: true
              }
            }
          }
        }
      }
    });

    if (!existingPart) {
      return res.status(404).json({ error: "Audio part not found." });
    }

    if (existingPart.chapter.audio.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only update your own audio parts." });
    }

    // If order is being changed, validate it's sequential
    if (order !== undefined && order !== existingPart.order) {
      const otherParts = await prisma.audioPart.findMany({
        where: { 
          chapterId: existingPart.chapter.id,
          id: { not: partId }
        },
        orderBy: { order: 'asc' },
        select: { order: true }
      });

      // Check if the new order would create gaps
      const allOrders = [...otherParts.map(p => p.order), order].sort((a, b) => a - b);
      for (let i = 0; i < allOrders.length; i++) {
        if (allOrders[i] !== i + 1) {
          return res.status(400).json({
            success: false,
            message: "Part orders must be sequential without gaps."
          });
        }
      }
    }

    // Validate status
    const partStatus = status === 'PUBLISHED' ? 'PUBLISHED' : 
                      status === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT';

    const updatedPart = await prisma.audioPart.update({
      where: { id: partId },
      data: {
        title: title !== undefined ? title : existingPart.title,
        description: description !== undefined ? description : existingPart.description,
        order: order !== undefined ? order : existingPart.order,
        status: partStatus,
        fileName: fileName !== undefined ? fileName : existingPart.fileName,
        publicId: publicId !== undefined ? publicId : existingPart.publicId,
        fileUrl: fileUrl !== undefined ? fileUrl : existingPart.fileUrl,
        duration: duration !== undefined ? duration : existingPart.duration
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            audio: {
              select: {
                id: true,
                title: true
              }
            }
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

    console.log('✅ Audio part updated successfully:', updatedPart.id);
    res.status(200).json({
      success: true,
      message: "Audio part updated successfully",
      part: updatedPart
    });
  } catch (error) {
    console.error("🔥 updateAudioPart error:", error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: "A part with this order already exists for this chapter."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to update audio part",
      error: error.message
    });
  }
};

// @desc Delete an audio part
export const deleteAudioPart = async (req, res) => {
  try {
    const { partId } = req.params;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    // Check if part exists and belongs to user
    const existingPart = await prisma.audioPart.findUnique({
      where: { id: partId },
      include: {
        chapter: {
          select: {
            id: true,
            audio: {
              select: {
                id: true,
                userId: true
              }
            }
          }
        }
      }
    });

    if (!existingPart) {
      return res.status(404).json({ error: "Audio part not found." });
    }

    if (existingPart.chapter.audio.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own audio parts." });
    }

    // Delete the part
    await prisma.audioPart.delete({
      where: { id: partId }
    });

    console.log('✅ Audio part deleted successfully:', partId);
    res.status(200).json({
      success: true,
      message: "Audio part deleted successfully"
    });
  } catch (error) {
    console.error("🔥 deleteAudioPart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete audio part",
      error: error.message
    });
  }
};

// @desc Reorder audio parts
export const reorderAudioParts = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { partOrders } = req.body; // Array of { id, order }

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    // Check if chapter exists and belongs to user
    const chapter = await prisma.audioChapter.findUnique({
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

    if (!chapter) {
      return res.status(404).json({ error: "Audio chapter not found." });
    }

    if (chapter.audio.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only reorder parts for your own audio chapters." });
    }

    // Validate that all parts belong to this chapter
    const partIds = partOrders.map(po => po.id);
    const parts = await prisma.audioPart.findMany({
      where: { 
        id: { in: partIds },
        chapterId 
      }
    });

    if (parts.length !== partIds.length) {
      return res.status(400).json({ error: "Some parts do not belong to this chapter." });
    }

    // Update all parts with new orders
    const updatePromises = partOrders.map(({ id, order }) =>
      prisma.audioPart.update({
        where: { id },
        data: { order }
      })
    );

    await Promise.all(updatePromises);

    // Fetch updated parts
    const updatedParts = await prisma.audioPart.findMany({
      where: { chapterId },
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

    console.log('✅ Audio parts reordered successfully');
    res.status(200).json({
      success: true,
      message: "Audio parts reordered successfully",
      parts: updatedParts
    });
  } catch (error) {
    console.error("🔥 reorderAudioParts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder audio parts",
      error: error.message
    });
  }
};


