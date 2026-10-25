import { Router } from "express";
import { forensicsController } from "../controllers/forensicsController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Forensic leak verification endpoint
router.post("/verify", authenticate, forensicsController.verifyLeakedText);

// Verification logs
router.get("/history", authenticate, forensicsController.getVerificationHistory);

export default router;
