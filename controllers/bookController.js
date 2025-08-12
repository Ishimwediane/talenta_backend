import prisma from '../prismaClient.js';

export const uploadBook = async (req, res) => {
  try {
    const {
      title,
      author,
      description,
      isbn,
      tags,
      publishedAt,
      coverImage: bodyCoverImageUrl,
      bookFile: bodyBookFileUrl,
    } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: 'Title and authors are required.' });
    }

    // Parse tags correctly
    let parsedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    // Get URLs for uploaded files or fallback to body values
    const coverImageUrl = req.files?.coverImage
      ? `/uploads/books/${req.files.coverImage[0].filename}`
      : bodyCoverImageUrl || null;

    const bookFileUrl = req.files?.bookFile
      ? `/uploads/books/${req.files.bookFile[0].filename}`
      : bodyBookFileUrl || null;

    if (!bookFileUrl) {
      return res.status(400).json({ error: 'Book file is required.' });
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        description,
        isbn,
        tags: parsedTags,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        coverImage: coverImageUrl,
        bookFile: bookFileUrl,
        // if you have userId or others add here
      },
    });

    res.status(201).json(book);
  } catch (error) {
    console.error('🔥 uploadBook error:', error);
    if (error.code === 'P2002' && error.meta?.target.includes('isbn')) {
      return res.status(400).json({ error: 'ISBN already exists.' });
    }
    res.status(500).json({ error: 'Failed to upload book.' });
  }
};
