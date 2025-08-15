import express from "express";
import { uploadAudioMiddleware } from "../middleware/uploadAudioMiddleware.js";
import { uploadAudio, playAudio,getAllAudios,getAudioById} from "../controllers/audio.controller.js";
import { authenticateToken ,verifyAdmin} from "../middleware/auth.middleware.js";

const router = express.Router();

// Upload audio
router.post("/upload", authenticateToken,verifyAdmin,uploadAudioMiddleware.single("audio"), uploadAudio);

// Play audio
router.get("/play/:filename", playAudio);
router.get("/", getAllAudios);
router.get("/:id", getAudioById);

export default router;
