import { Router } from "express";
import { accessController } from "../controllers/accessController";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

// Grant access to a user for document (Admin only)
router.post("/:id/access", authenticate, requireAdmin, accessController.grantAccess);

// Revoke access from a user for document (Admin only)
router.delete("/:id/access/:userId", authenticate, requireAdmin, accessController.revokeAccess);

// Get current permissions list for a document
router.get("/:id/access", authenticate, accessController.getDocumentAccessList);

export default router;
