import express from "express";
import upload from "@/middleware/upload";
import { uploadAudio, getAllAudios } from "@/controllers/audioController";

const router = express.Router();

router.post("/upload", upload.single("audio"), uploadAudio);
router.get("/all", getAllAudios);

export default router;
