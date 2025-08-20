// controllers/bookController.js

import prisma from '../prismaClient.js';
import { v2 as cloudinary } from 'cloudinary';

import axios from 'axios';

import { extractContentFromUrl } from '../services/contentExtractor.js'; // <-- THE FIX IS HERE

// GET all PUBLISHED books for the public
export const getPublishedBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
    });
    res.status(200).json(books);
  } catch (error) {
    console.error('🔥 getPublishedBooks error:', error);
    res.status(500).json({ error: 'Failed to retrieve books.' });
  }
};

// GET all of logged-in user's books (drafts and published)
export const getMyBooks = async (req, res) => {
    try {
        const books = await prisma.book.findMany({
            where: { userId: req.user.id },
            orderBy: { updatedAt: 'desc' }
        });
        res.status(200).json(books);
    } catch (error) {
        console.error('🔥 getMyBooks error:', error);
        res.status(500).json({ error: 'Failed to retrieve your books.' });
    }
}

// GET a single book by ID for editing
export const getBookById = async (req, res) => {
  try {
    const query = { id: req.params.id };

    // Only filter by userId if the user is logged in
    if (req.user) {
      query.userId = req.user.id;
    }

    const book = await prisma.book.findFirst({
      where: query,
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found or you do not have permission.' });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error('🔥 getBookById error:', error);
    res.status(500).json({ error: 'Failed to retrieve book.' });
  }
};


// POST a new book
export const createBook = async (req, res) => {
  try {
    let { title, author, description, isbn, tags, content, status } = req.body;

    const coverImageFile = req.files?.coverImage?.[0];
    const bookFile = req.files?.bookFile?.[0];

    const coverImageUrl = coverImageFile?.path;
    const coverImagePublicId = coverImageFile?.filename;

    // Book file URLs
    const bookFileUrl = bookFile?.path;
    const bookFilePublicId = bookFile?.filename;

    // Generate readUrl and downloadUrl
    let readUrl = null;
    let downloadUrl = null;
    if (bookFileUrl) {
      readUrl = bookFileUrl.replace('/upload/', '/upload/fl_attachment:false/'); // inline
      downloadUrl = bookFileUrl; // default raw URL for download
    }

    if (!title) return res.status(400).json({ error: 'Title is required.' });

    if (bookFileUrl && !content) {
      console.log(`Extracting content from: ${bookFileUrl}`);
      content = await extractContentFromUrl(bookFileUrl);
    }

    const book = await prisma.book.create({
      data: {
        title,
        author: author || 'Unknown Author',
        description,
        isbn: isbn || null,
        tags: tags ? JSON.parse(tags) : [],
        content: content || '',
        status: status || 'DRAFT',
        userId: req.user.id,
        coverImage: coverImageUrl,
        coverImagePublicId: coverImagePublicId,
        bookFile: bookFileUrl,
        bookFilePublicId: bookFilePublicId,
        readUrl,
        downloadUrl,
      },
    });

    res.status(201).json(book);
  } catch (error) {
    console.error('🔥 createBook error:', error);
    res.status(500).json({ error: 'Failed to create book.' });
  }
};


// PUT (update) an existing book
export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, author, description, isbn, tags, content, status } = req.body;

    const existingBook = await prisma.book.findFirst({ where: { id, userId: req.user.id } });
    if (!existingBook) return res.status(404).json({ error: "Book not found or you don't have permission." });

    const dataToUpdate = {
      title,
      author,
      description,
      content,
      status,
      isbn: isbn || null,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : undefined,
    };

    const coverImageFile = req.files?.coverImage?.[0];
    const bookFile = req.files?.bookFile?.[0];

    if (coverImageFile) {
      if (existingBook.coverImagePublicId) await cloudinary.uploader.destroy(existingBook.coverImagePublicId);
      dataToUpdate.coverImage = coverImageFile.path;
      dataToUpdate.coverImagePublicId = coverImageFile.filename;
    }

    if (bookFile) {
      if (existingBook.bookFilePublicId) await cloudinary.uploader.destroy(existingBook.bookFilePublicId, { resource_type: 'raw' });
      dataToUpdate.bookFile = bookFile.path;
      dataToUpdate.bookFilePublicId = bookFile.filename;

      // Update readUrl and downloadUrl
      dataToUpdate.readUrl = bookFile.path.replace('/upload/', '/upload/fl_attachment:false/');
      dataToUpdate.downloadUrl = bookFile.path;

      console.log(`Extracting content from new file: ${bookFile.path}`);
      dataToUpdate.content = await extractContentFromUrl(bookFile.path);
    }

    if (status === 'PUBLISHED' && !existingBook.publishedAt) {
      dataToUpdate.publishedAt = new Date();
    }

    const updatedBook = await prisma.book.update({ where: { id }, data: dataToUpdate });
    res.status(200).json(updatedBook);
  } catch (error) {
    console.error('🔥 updateBook error:', error);
    res.status(500).json({ error: 'Failed to update book.' });
  }
};

// DELETE a book
export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const bookToDelete = await prisma.book.findFirst({ where: { id, userId: req.user.id } });
    
    if (!bookToDelete) {
      return res.status(404).json({ error: "Book not found or you don't have permission." });
    }

    if (bookToDelete.coverImagePublicId) {
        await cloudinary.uploader.destroy(bookToDelete.coverImagePublicId);
    }
    if (bookToDelete.bookFilePublicId) {
        await cloudinary.uploader.destroy(bookToDelete.bookFilePublicId, { resource_type: 'raw' });
    }

    await prisma.book.delete({ where: { id } });
    res.status(200).json({ message: 'Book deleted successfully.' });
  } catch (error) {
    console.error('🔥 deleteBook error:', error);
    res.status(500).json({ error: 'Failed to delete book.' });
  }
};




