import path from "path";
import fs from "fs";
import mime from 'mime-types'; 
import { fileURLToPath } from 'url';
import prisma from '../lib/prisma.js'; // Make sure this import exists

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc Upload an audio file
export const uploadAudio = async (req, res) => {
  try {
    const { title, description, tags } = req.body;

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

    const audio = await prisma.audio.create({
      data: {
        title: title || req.file?.originalname || "Untitled",
        description: description || null,
        tags: parsedTags,
        fileName: req.file?.filename || null,
        fileUrl: audioFileUrl,
        userId: req.user.id, // from JWT
      },
    });

    res.status(201).json({ message: "Audio uploaded successfully", audio });
  } catch (error) {
    console.error("🔥 uploadAudio error:", error);
    res.status(500).json({ error: "Failed to upload audio." });
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

    res.status(200).json({ audios });
  } catch (error) {
    console.error("🔥 getAllAudios error:", error);
    res.status(500).json({ error: "Failed to fetch audios." });
  }
};

export const getAudioById = async (req, res) => {
  try {
    const { id } = req.params;

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

    if (!audio) return res.status(404).json({ error: "Audio not found." });

    res.status(200).json({ audio });
  } catch (error) {
    console.error("🔥 getAudioById error:", error);
    res.status(500).json({ error: "Failed to fetch audio." });
  }
};