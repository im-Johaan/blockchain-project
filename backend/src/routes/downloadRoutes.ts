import { Router } from "express";
import { downloadController } from "../controllers/downloadController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Secure document download with real-time on-chain permission enforcement and issuance registration
router.get("/:id/download", authenticate, downloadController.downloadDocument);
router.post("/:id/download", authenticate, downloadController.downloadDocument);

export default router;
