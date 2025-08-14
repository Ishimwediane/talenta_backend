import fs from "fs";
import path from "path";
import cloudinary from "@/lib/cloudinary";
import prisma from "@/lib/prisma";

export const uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Local path saved by Multer
    const filePath = path.join(process.cwd(), req.file.path);

    // Upload to Cloudinary
    const cloudinaryRes = await cloudinary.uploader.upload(filePath, {
      resource_type: "video", // for audio
      folder: "talenta_audios",
    });

    // Remove local file after upload
    fs.unlinkSync(filePath);

    // Save to Postgres
    const audio = await prisma.audio.create({
      data: {
        publicId: cloudinaryRes.public_id,
        fileUrl: cloudinaryRes.secure_url,
      },
    });

    res.status(200).json(audio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllAudios = async (req, res) => {
  try {
    const audios = await prisma.audio.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(audios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
