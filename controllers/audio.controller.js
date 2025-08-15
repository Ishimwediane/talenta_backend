import path from "path";
import fs from "fs";

// @desc Upload an audio file
export const uploadAudio = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    return res.status(200).json({
      message: "Audio uploaded successfully",
      file: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/audio/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error("Error uploading audio:", error);
    res.status(500).json({ message: "Server error while uploading audio" });
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
