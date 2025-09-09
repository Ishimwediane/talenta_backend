import express from "express";
import { 
  createAudioPart,
  getAudioParts,
  getAudioPart,
  updateAudioPart,
  deleteAudioPart,
  reorderAudioParts,
  createDirectAudioPart,
  getDirectAudioParts
} from "../controllers/audioPartController.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { tryAuthenticateToken } from "../middleware/tryAuthenticateToken.js";

const router = express.Router();

// Chapter-based routes (existing)
router.post("/:chapterId/parts", authenticateToken, createAudioPart);
router.get("/:chapterId/parts", tryAuthenticateToken, getAudioParts);
router.get("/parts/:partId", tryAuthenticateToken, getAudioPart);
router.patch("/parts/:partId", authenticateToken, updateAudioPart);
router.delete("/parts/:partId", authenticateToken, deleteAudioPart);
router.patch("/:chapterId/parts/reorder", authenticateToken, reorderAudioParts);

// Direct audio parts routes (new)
router.post("/:audioId/parts", authenticateToken, createDirectAudioPart);
router.get("/:audioId/parts", tryAuthenticateToken, getDirectAudioParts);

export default router;






