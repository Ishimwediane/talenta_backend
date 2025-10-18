import prisma from '../prismaClient.js';

// Helper: emit to a book room if io available
function emitBookUpdate(app, bookId, payload) {
  try {
    const io = app?.locals?.io;
    if (io) io.to(`book:${bookId}`).emit('book:update', { bookId, ...payload });
  } catch {}
}

function emitAudioUpdate(app, audioId, payload) {
  try {
    const io = app?.locals?.io;
    if (io) io.to(`audio:${audioId}`).emit('audio:update', { audioId, ...payload });
  } catch {}
}

export const toggleBookLike = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.bookLike.findUnique({ where: { bookId_userId: { bookId: id, userId } } });
    if (existing) {
      await prisma.bookLike.delete({ where: { bookId_userId: { bookId: id, userId } } });
    } else {
      await prisma.bookLike.create({ data: { bookId: id, userId } });
    }

    const likesCount = await prisma.bookLike.count({ where: { bookId: id } });
    const book = await prisma.book.update({ where: { id }, data: { likesCount } });

    emitBookUpdate(req.app, id, { likesCount });
    res.json({ likesCount, liked: !existing });
  } catch (e) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

export const rateBook = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    let { stars } = req.body;
    stars = parseInt(stars, 10);
    if (!(stars >= 1 && stars <= 5)) return res.status(400).json({ error: 'stars must be 1..5' });

    await prisma.bookRating.upsert({
      where: { bookId_userId: { bookId: id, userId: req.user.id } },
      update: { stars },
      create: { bookId: id, userId: req.user.id, stars },
    });

    const agg = await prisma.bookRating.aggregate({
      where: { bookId: id },
      _avg: { stars: true },
      _count: { stars: true },
    });
    const ratingAvg = Number(agg._avg.stars || 0);
    const ratingCount = Number(agg._count.stars || 0);

    await prisma.book.update({ where: { id }, data: { ratingAvg, ratingCount } });
    emitBookUpdate(req.app, id, { ratingAvg, ratingCount });
    res.json({ ratingAvg, ratingCount });
  } catch (e) {
    res.status(500).json({ error: 'Failed to rate' });
  }
};

export const commentBook = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'content required' });

    const comment = await prisma.bookComment.create({
      data: { bookId: id, userId: req.user.id, content: content.trim() },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    const commentsCount = await prisma.bookComment.count({ where: { bookId: id } });
    await prisma.book.update({ where: { id }, data: { commentsCount } });
    emitBookUpdate(req.app, id, { commentsCount });
    res.status(201).json({ comment, commentsCount });
  } catch (e) {
    res.status(500).json({ error: 'Failed to comment' });
  }
};

export const viewBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id']?.toString();
    const ipHash = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')?.toString().slice(-64);

    // Throttle: skip if a view by same user/session/ip within last 15 minutes
    const since = new Date(Date.now() - 15 * 60 * 1000);
    const recent = await prisma.bookView.findFirst({
      where: {
        bookId: id,
        createdAt: { gte: since },
        OR: [
          { userId: userId || undefined },
          { sessionId: sessionId || undefined },
          { ipHash: ipHash || undefined },
        ],
      },
    });
    if (!recent) {
      await prisma.bookView.create({ data: { bookId: id, userId, sessionId, ipHash } });
      await prisma.book.update({ where: { id }, data: { viewsCount: { increment: 1 } } });
      emitBookUpdate(req.app, id, { increment: { viewsCount: 1 } });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to record view' });
  }
};

export const shareBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const { channel } = req.body;
    await prisma.bookShare.create({ data: { bookId: id, userId, channel: (channel || 'link').toString().slice(0,50) } });
    await prisma.book.update({ where: { id }, data: { sharesCount: { increment: 1 } } });
    emitBookUpdate(req.app, id, { increment: { sharesCount: 1 } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to record share' });
  }
};

// AUDIO
export const toggleAudioLike = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.audioLike.findUnique({ where: { audioId_userId: { audioId: id, userId } } });
    if (existing) {
      await prisma.audioLike.delete({ where: { audioId_userId: { audioId: id, userId } } });
    } else {
      await prisma.audioLike.create({ data: { audioId: id, userId } });
    }

    const likesCount = await prisma.audioLike.count({ where: { audioId: id } });
    await prisma.audio.update({ where: { id }, data: { likesCount } });
    emitAudioUpdate(req.app, id, { likesCount });
    res.json({ likesCount, liked: !existing });
  } catch {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

export const rateAudio = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    let { stars } = req.body;
    stars = parseInt(stars, 10);
    if (!(stars >= 1 && stars <= 5)) return res.status(400).json({ error: 'stars must be 1..5' });

    await prisma.audioRating.upsert({
      where: { audioId_userId: { audioId: id, userId: req.user.id } },
      update: { stars },
      create: { audioId: id, userId: req.user.id, stars },
    });

    const agg = await prisma.audioRating.aggregate({ where: { audioId: id }, _avg: { stars: true }, _count: { stars: true } });
    const ratingAvg = Number(agg._avg.stars || 0);
    const ratingCount = Number(agg._count.stars || 0);
    await prisma.audio.update({ where: { id }, data: { ratingAvg, ratingCount } });
    emitAudioUpdate(req.app, id, { ratingAvg, ratingCount });
    res.json({ ratingAvg, ratingCount });
  } catch {
    res.status(500).json({ error: 'Failed to rate' });
  }
};

export const commentAudio = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'content required' });

    const comment = await prisma.audioComment.create({
      data: { audioId: id, userId: req.user.id, content: content.trim() },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    const commentsCount = await prisma.audioComment.count({ where: { audioId: id } });
    await prisma.audio.update({ where: { id }, data: { commentsCount } });
    emitAudioUpdate(req.app, id, { commentsCount });
    res.status(201).json({ comment, commentsCount });
  } catch {
    res.status(500).json({ error: 'Failed to comment' });
  }
};

export const viewAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id']?.toString();
    const ipHash = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')?.toString().slice(-64);
    const since = new Date(Date.now() - 15 * 60 * 1000);
    const recent = await prisma.audioView.findFirst({
      where: {
        audioId: id,
        createdAt: { gte: since },
        OR: [
          { userId: userId || undefined },
          { sessionId: sessionId || undefined },
          { ipHash: ipHash || undefined },
        ],
      },
    });
    if (!recent) {
      await prisma.audioView.create({ data: { audioId: id, userId, sessionId, ipHash } });
      await prisma.audio.update({ where: { id }, data: { viewsCount: { increment: 1 } } });
      emitAudioUpdate(req.app, id, { increment: { viewsCount: 1 } });
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to record view' });
  }
};

export const shareAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const { channel } = req.body;
    await prisma.audioShare.create({ data: { audioId: id, userId, channel: (channel || 'link').toString().slice(0,50) } });
    await prisma.audio.update({ where: { id }, data: { sharesCount: { increment: 1 } } });
    emitAudioUpdate(req.app, id, { increment: { sharesCount: 1 } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to record share' });
  }
};


