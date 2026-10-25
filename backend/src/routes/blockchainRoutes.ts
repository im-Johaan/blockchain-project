import { Router } from "express";
import { blockchainController } from "../controllers/blockchainController";

const router = Router();

// Blockchain explorer status, blocks, transactions, and audit trails
router.get("/status", blockchainController.getStatus);
router.get("/blocks", blockchainController.getBlocks);
router.get("/transactions/:txHash", blockchainController.getTransaction);
router.get("/events", blockchainController.getEvents);
router.get("/audit/:documentId", blockchainController.getDocumentAuditTrail);

export default router;
