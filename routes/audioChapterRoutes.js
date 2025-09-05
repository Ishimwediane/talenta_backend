import express from "express";
import { 
  createAudioChapter,
  getAudioChapters,
  getAudioChapter,
  updateAudioChapter,
  deleteAudioChapter,
  reorderAudioChapters
} from "../controllers/audioChapterController.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { tryAuthenticateToken } from "../middleware/tryAuthenticateToken.js";

const router = express.Router();

// Protected routes - require authentication
router.post("/:audioId/chapters", authenticateToken, createAudioChapter);
router.get("/:audioId/chapters", tryAuthenticateToken, getAudioChapters);
router.get("/chapters/:chapterId", tryAuthenticateToken, getAudioChapter);
router.patch("/chapters/:chapterId", authenticateToken, updateAudioChapter);
router.delete("/chapters/:chapterId", authenticateToken, deleteAudioChapter);
router.patch("/:audioId/chapters/reorder", authenticateToken, reorderAudioChapters);

export default router;


