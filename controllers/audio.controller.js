import path from "path";
import fs from "fs";

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

// @desc Play audio (streaming)
export const playAudio = (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join("uploads/audio", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Audio file not found" });
    }

    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Content-Length": stat.size
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    console.error("Error playing audio:", error);
    res.status(500).json({ message: "Server error while playing audio" });
  }
};
export const getAllAudios = async (req, res) => {
  try {
    const audios = await prisma.audio.findMany({
      orderBy: { createdAt: "desc" },
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
    });

    if (!audio) return res.status(404).json({ error: "Audio not found." });

    res.status(200).json({ audio });
  } catch (error) {
    console.error("🔥 getAudioById error:", error);
    res.status(500).json({ error: "Failed to fetch audio." });
  }
};
