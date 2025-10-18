// controllers/tableOfContentController.js

import prisma from '../prismaClient.js';

// GET table of contents for a book
export const getTableOfContents = async (req, res) => {
  try {
    const { bookId } = req.params;
    
    // Verify user owns the book
    const book = await prisma.book.findFirst({
      where: { 
        id: bookId, 
        userId: req.user.id 
      }
    });
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found or you do not have permission.' });
    }

    const tableOfContents = await prisma.tableOfContent.findMany({
      where: { bookId },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            order: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.status(200).json(tableOfContents);
  } catch (error) {
    console.error('🔥 getTableOfContents error:', error);
    res.status(500).json({ error: 'Failed to retrieve table of contents.' });
  }
};

// POST create a new table of contents entry
export const createTableOfContentEntry = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, description, order, pageNumber, chapterId } = req.body;

    // Verify user owns the book
    const book = await prisma.book.findFirst({
      where: { 
        id: bookId, 
        userId: req.user.id 
      }
    });
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found or you do not have permission.' });
    }

    // Verify chapter belongs to the book if chapterId is provided
    if (chapterId) {
      const chapter = await prisma.chapter.findFirst({
        where: { 
          id: chapterId, 
          bookId: bookId 
        }
      });
      
      if (!chapter) {
        return res.status(400).json({ error: 'Chapter does not belong to this book.' });
      }
    }

    const tableOfContentEntry = await prisma.tableOfContent.create({
      data: {
        title,
        description: description || null,
        order: order || 0,
        pageNumber: pageNumber || null,
        chapterId: chapterId || null,
        bookId
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            order: true
          }
        }
      }
    });

    res.status(201).json(tableOfContentEntry);
  } catch (error) {
    console.error('🔥 createTableOfContentEntry error:', error);
    res.status(500).json({ error: 'Failed to create table of contents entry.' });
  }
};

// PUT update a table of contents entry
export const updateTableOfContentEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { title, description, order, pageNumber, chapterId } = req.body;

    // Verify user owns the book through the table of contents entry
    const existingEntry = await prisma.tableOfContent.findFirst({
      where: { id: entryId },
      include: {
        book: {
          select: { userId: true }
        }
      }
    });
    
    if (!existingEntry || existingEntry.book.userId !== req.user.id) {
      return res.status(404).json({ error: 'Table of contents entry not found or you do not have permission.' });
    }

    // Verify chapter belongs to the book if chapterId is provided
    if (chapterId) {
      const chapter = await prisma.chapter.findFirst({
        where: { 
          id: chapterId, 
          bookId: existingEntry.bookId 
        }
      });
      
      if (!chapter) {
        return res.status(400).json({ error: 'Chapter does not belong to this book.' });
      }
    }

    const updatedEntry = await prisma.tableOfContent.update({
      where: { id: entryId },
      data: {
        title: title || existingEntry.title,
        description: description !== undefined ? description : existingEntry.description,
        order: order !== undefined ? order : existingEntry.order,
        pageNumber: pageNumber !== undefined ? pageNumber : existingEntry.pageNumber,
        chapterId: chapterId !== undefined ? chapterId : existingEntry.chapterId,
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            order: true
          }
        }
      }
    });

    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error('🔥 updateTableOfContentEntry error:', error);
    res.status(500).json({ error: 'Failed to update table of contents entry.' });
  }
};

// DELETE a table of contents entry
export const deleteTableOfContentEntry = async (req, res) => {
  try {
    const { entryId } = req.params;

    // Verify user owns the book through the table of contents entry
    const existingEntry = await prisma.tableOfContent.findFirst({
      where: { id: entryId },
      include: {
        book: {
          select: { userId: true }
        }
      }
    });
    
    if (!existingEntry || existingEntry.book.userId !== req.user.id) {
      return res.status(404).json({ error: 'Table of contents entry not found or you do not have permission.' });
    }

    await prisma.tableOfContent.delete({
      where: { id: entryId }
    });

    res.status(200).json({ message: 'Table of contents entry deleted successfully.' });
  } catch (error) {
    console.error('🔥 deleteTableOfContentEntry error:', error);
    res.status(500).json({ error: 'Failed to delete table of contents entry.' });
  }
};

// POST reorder table of contents entries
export const reorderTableOfContents = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { entries } = req.body; // Array of { id, order }

    // Verify user owns the book
    const book = await prisma.book.findFirst({
      where: { 
        id: bookId, 
        userId: req.user.id 
      }
    });
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found or you do not have permission.' });
    }

    // Update each entry's order
    const updatePromises = entries.map(({ id, order }) =>
      prisma.tableOfContent.update({
        where: { id },
        data: { order }
      })
    );

    await Promise.all(updatePromises);

    // Return updated table of contents
    const updatedTableOfContents = await prisma.tableOfContent.findMany({
      where: { bookId },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            order: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.status(200).json(updatedTableOfContents);
  } catch (error) {
    console.error('🔥 reorderTableOfContents error:', error);
    res.status(500).json({ error: 'Failed to reorder table of contents.' });
  }
};
