import { Router } from "express";
import { documentController } from "../controllers/documentController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { uploadMiddleware } from "../middleware/upload";

const router = Router();

// Register new document (Admin only)
router.post(
  "/",
  authenticate,
  requireAdmin,
  uploadMiddleware.single("file"),
  documentController.uploadDocument
);

// List all documents
router.get("/", authenticate, documentController.getAllDocuments);

// Get single document
router.get("/:id", authenticate, documentController.getDocumentById);

// Add new version (Admin only)
router.post(
  "/:id/versions",
  authenticate,
  requireAdmin,
  uploadMiddleware.single("file"),
  documentController.addVersion
);

// Get version history
router.get("/:id/versions", authenticate, documentController.getVersionHistory);

// Get version raw content
router.get("/:id/versions/:version/content", authenticate, documentController.getVersionContent);

export default router;
