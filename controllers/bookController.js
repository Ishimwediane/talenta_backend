import prisma from '../prismaClient.js';

export async function uploadBook(req, res) {
  try {
    const file = req.file;
    const {
      title,
      authors,
      description,
      publisher,
      publicationDate,
      isbn,
      category,
      language,
      tags,
      pageCount,
      rights,
      coverImageUrl,
      isPublished,
      userId,
    } = req.body;

    if (!file) return res.status(400).json({ error: 'Book file is required' });
    if (!title || !authors || !userId)
      return res.status(400).json({ error: 'Title, authors, and userId are required' });

    console.log("📦 Incoming form data:", req.body);
    console.log("📄 Uploaded file:", file);

    const book = await prisma.book.create({
      data: {
        title,
        authors,
        description,
        publisher,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        isbn,
        category,
        language,
        tags: tags ? JSON.parse(tags) : [],
        pageCount: pageCount ? parseInt(pageCount) : null,
        rights,
        coverImageUrl,
        bookFileUrl: `/uploads/books/${file.filename}`,
        isPublished: isPublished === 'true',
        userId: parseInt(userId), // 👈 ensure it's a number if Prisma expects Int
      },
    });

    res.status(201).json(book);
  } catch (error) {
    console.error("🔥 UploadBook Prisma Error:", error);
    res.status(500).json({
      error: 'Failed to upload book.',
      message: error.message,
      stack: error.stack,
    });
  }
}



export async function getAllBooks(req, res) {
  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching books.' });
  }
}

export async function getBookById(req, res) {
  try {
    const book = await prisma.book.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching book.' });
  }
}
