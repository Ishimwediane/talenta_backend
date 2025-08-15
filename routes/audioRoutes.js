import express from "express";
import { uploadAudioMiddleware } from "../middleware/uploadAudioMiddleware.js";
import { uploadAudio, playAudio } from "../controllers/audio.controller.js";

const router = express.Router();

// Upload audio
router.post("/upload", uploadAudioMiddleware.single("audio"), uploadAudio);

// Play audio
router.get("/play/:filename", playAudio);

export default router;
