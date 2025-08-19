import path from "path";
import fs from "fs";
import mime from 'mime-types'; 
import { fileURLToPath } from 'url';
import prisma from '../lib/prisma.js'; // Make sure this import exists

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc Upload an audio file
export const uploadAudio = async (req, res) => {
  console.log('=== UPLOAD DEBUG START ===');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  console.log('Request user:', req.user);
  console.log('Request headers:', req.headers);
  console.log('=== UPLOAD DEBUG END ===');
  try {
    console.log('📤 Upload request received:', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null,
      user: req.user ? { id: req.user.id } : null
    });

    const { title, description, tags, status } = req.body;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    // Require at least a title or file
    if (!title && !req.file) {
      return res.status(400).json({ error: "Audio title or file is required." });
    }

    // Parse tags (support string or array)
    let parsedTags = [];
    if (tags) {
      if (typeof tags === "string") {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.split(",").map(tag => tag.trim()).filter(Boolean);
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    // Get audio file URL from upload or fallback to body
    const audioFileUrl = req.file
      ? `/uploads/audio/${req.file.filename}`
      : req.body.audioFile || null;

    if (!audioFileUrl) {
      return res.status(400).json({ error: "Audio file is required." });
    }

    // Validate status
    const audioStatus = status === 'draft' ? 'DRAFT' : 'PUBLISHED';

    console.log('💾 Creating audio record in database...');

    const audio = await prisma.audio.create({
      data: {
        title: title || req.file?.originalname || "Untitled",
        description: description || null,
        tags: parsedTags,
        fileName: req.file?.filename || null,
        fileUrl: audioFileUrl,
        status: audioStatus,
        userId: req.user.id, // from JWT
      },
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

    console.log('✅ Audio uploaded successfully:', audio.id);
    res.status(201).json({ message: "Audio uploaded successfully", audio });
  } catch (error) {
    console.error("🔥 uploadAudio error:", error);
    
    // If there was a file uploaded but database save failed, clean up the file
    if (req.file) {
      try {
        const filePath = path.join(__dirname, '..', 'uploads', 'audio', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('🗑️ Cleaned up uploaded file after database error');
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    // Send more specific error messages
    if (error.code === 'P2002') {
      res.status(409).json({ error: "A record with this data already exists." });
    } else if (error.code && error.code.startsWith('P')) {
      res.status(500).json({ error: "Database error occurred." });
    } else {
      res.status(500).json({ error: "Failed to upload audio." });
    }
  }
};

// @desc Update audio status (publish draft)
export const updateAudioStatus = async (req, res) => {
  try {
    console.log('📝 Update status request:', { params: req.params, body: req.body, user: req.user?.id });

    const { id } = req.params;
    const { status } = req.body;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    // Validate status
    if (!['DRAFT', 'PUBLISHED'].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'draft' or 'published'." });
    }

    // Check if audio exists and belongs to user
    const existingAudio = await prisma.audio.findUnique({
      where: { id }
    });

    if (!existingAudio) {
      return res.status(404).json({ error: "Audio not found." });
    }

    if (existingAudio.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only update your own audio." });
    }

    const updatedAudio = await prisma.audio.update({
      where: { id },
      data: { status },
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

    console.log('✅ Audio status updated successfully:', updatedAudio.id);
    res.status(200).json({ 
      message: `Audio ${status === 'PUBLISHED' ? 'PUBLISHED' : 'saved as draft'} successfully`, 
      audio: updatedAudio 
    });
  } catch (error) {
    console.error("🔥 updateAudioStatus error:", error);
    res.status(500).json({ error: "Failed to update audio status." });
  }
};

// @desc Play audio (streaming with range support)
export const playAudio = (req, res) => {
  try {
    const { filename } = req.params;
    console.log(`[Backend] Received request for filename: ${filename}`);

    // Set CORS headers first
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Range, Content-Range, Accept-Ranges');
    res.header('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Create robust path - go up from controllers to project root, then into uploads/audio
    const filePath = path.join(__dirname, '..', 'uploads', 'audio', filename);
    console.log(`[Backend] Checking for file at absolute path: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.error(`[Backend] FILE NOT FOUND at path: ${filePath}`);
      return res.status(404).json({ message: "Audio file not found" });
    }

    console.log(`[Backend] File found! Processing request.`);

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const mimeType = mime.lookup(filename) || 'audio/mpeg';

    // Handle range requests for proper audio streaming
    const range = req.headers.range;
    
    if (range) {
      console.log(`[Backend] Range request: ${range}`);
      
      // Parse range header (e.g., "bytes=0-1023")
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      if (start >= fileSize || end >= fileSize) {
        res.status(416).set({
          'Content-Range': `bytes */${fileSize}`
        });
        return res.end();
      }

      res.status(206).set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache'
      });

      const stream = fs.createReadStream(filePath, { start, end });
      stream.on('error', (err) => {
        console.error('[Backend] Stream Error:', err);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });
      stream.pipe(res);
      
    } else {
      // No range request - serve entire file
      console.log(`[Backend] Serving entire file`);
      
      res.set({
        'Content-Type': mimeType,
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache'
      });

      const stream = fs.createReadStream(filePath);
      stream.on('error', (err) => {
        console.error('[Backend] Stream Error:', err);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });
      stream.pipe(res);
    }

  } catch (error) {
    console.error("[Backend] CRITICAL ERROR in playAudio:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error while playing audio" });
    }
  }
};

export const getAllAudios = async (req, res) => {
  try {
    console.log('📋 Fetching all audios...');
    
    const audios = await prisma.audio.findMany({
      orderBy: { createdAt: "desc" },
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

    console.log(`✅ Found ${audios.length} audios`);
    res.status(200).json({ audios });
  } catch (error) {
    console.error("🔥 getAllAudios error:", error);
    res.status(500).json({ error: "Failed to fetch audios." });
  }
};

export const getAudioById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching audio by ID:', id);

    const audio = await prisma.audio.findUnique({
      where: { id },
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
      console.log('❌ Audio not found:', id);
      return res.status(404).json({ error: "Audio not found." });
    }

    console.log('✅ Audio found:', audio.id);
    res.status(200).json({ audio });
  } catch (error) {
    console.error("🔥 getAudioById error:", error);
    res.status(500).json({ error: "Failed to fetch audio." });
  }
};

// @desc Get user's drafts
export const getUserDrafts = async (req, res) => {
  try {
    console.log('📝 Fetching user drafts for user:', req.user?.id);

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    const drafts = await prisma.audio.findMany({
      where: { 
        userId: req.user.id,
        status: 'draft'
      },
      orderBy: { createdAt: "desc" },
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

    console.log(`✅ Found ${drafts.length} drafts for user ${req.user.id}`);
    res.status(200).json({ drafts });
  } catch (error) {
    console.error("🔥 getUserDrafts error:", error);
    res.status(500).json({ error: "Failed to fetch drafts." });
  }
};

// @desc Delete audio (draft or published)
export const deleteAudio = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Delete audio request:', { id, user: req.user?.id });

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    // Check if audio exists and belongs to user
    const existingAudio = await prisma.audio.findUnique({
      where: { id }
    });

    if (!existingAudio) {
      return res.status(404).json({ error: "Audio not found." });
    }

    if (existingAudio.userId !== req.user.id) {
      return res.status(403).json({ error: "You can only delete your own audio." });
    }

    // Delete the file from filesystem if it exists
    if (existingAudio.fileName) {
      const filePath = path.join(__dirname, '..', 'uploads', 'audio', existingAudio.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Deleted file:', filePath);
      }
    }

    // Delete from database
    await prisma.audio.delete({
      where: { id }
    });

    console.log('✅ Audio deleted successfully:', id);
    res.status(200).json({ message: "Audio deleted successfully" });
  } catch (error) {
    console.error("🔥 deleteAudio error:", error);
    res.status(500).json({ error: "Failed to delete audio." });
  }
};