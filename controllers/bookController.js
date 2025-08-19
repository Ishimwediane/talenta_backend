import prisma from '../prismaClient.js';

// No longer 'uploadBook', but a more general 'createBook'
export const createBook = async (req, res) => {
  try {
    const { title, author, description, isbn, tags, content, status } = req.body;
    const userId = req.user.id; // From authenticateToken middleware

    if (!title) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    // Use the cover image from the file upload if it exists
    const coverImageUrl = req.file
      ? `/uploads/books/${req.file.filename}`
      : null;

    const book = await prisma.book.create({
      data: {
        title,
        author: author || 'Unknown Author', // Author might not be set for an initial draft
        description,
        isbn,
        tags: tags ? JSON.parse(tags) : [],
        content,
        status: status || 'DRAFT', // Default to DRAFT if not specified
        coverImage: coverImageUrl,
        userId: userId, // Link the book to the logged-in user
      },
    });

    res.status(201).json(book);
  } catch (error) {
    console.error('🔥 createBook error:', error);
    res.status(500).json({ error: 'Failed to create book.' });
  }
};

export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, description, isbn, tags, content, status } = req.body;
    const userId = req.user.id;

    // First, find the book to ensure the user owns it
    const existingBook = await prisma.book.findUnique({
      where: { id },
    });

    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    if (existingBook.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not own this book.' });
    }

    const coverImageUrl = req.file
      ? `/uploads/books/${req.file.filename}`
      : undefined; // Use undefined to avoid overwriting with null

    const updatedBook = await prisma.book.update({
      where: {
        id,
      },
      data: {
        title,
        author,
        description,
        isbn,
        tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : undefined,
        content,
        status, // This is how you publish a book (by setting status to 'PUBLISHED')
        coverImage: coverImageUrl,
        publishedAt: status === 'PUBLISHED' && !existingBook.publishedAt ? new Date() : undefined,
      },
    });

    res.status(200).json(updatedBook);
  } catch (error) {
    console.error('🔥 updateBook error:', error);
    res.status(500).json({ error: 'Failed to update book.' });
  }
};


// Gets all PUBLISHED books for the public
export const getPublishedBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      where: {
        status: 'PUBLISHED',
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
    res.status(200).json(books);
  } catch (error) {
    console.error('🔥 getPublishedBooks error:', error);
    res.status(500).json({ error: 'Failed to retrieve books.' });
  }
};

// Gets all books (drafts and published) for the logged-in user
export const getMyBooks = async (req, res) => {
    try {
        const userId = req.user.id;
        const books = await prisma.book.findMany({
            where: {
                userId: userId,
            },
            orderBy: {
                updatedAt: 'desc',
            }
        });
        res.status(200).json(books);
    } catch (error) {
        console.error('🔥 getMyBooks error:', error);
        res.status(500).json({ error: 'Failed to retrieve your books.' });
    }
}