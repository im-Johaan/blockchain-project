import { Response } from "express";
import crypto from "crypto";
import { ethers } from "ethers";
import { AuthenticatedRequest } from "../middleware/auth";
import { storage, computeContentHash } from "../storage/metadataStorage";
import { blockchain } from "../blockchain/contractClient";
import { DocumentRecord, DocumentVersionInfo } from "../../../shared/types";

export const documentController = {
  // Register new document (Admin only)
  uploadDocument: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const file = req.file;
      const title = req.body.title || (file ? file.originalname : "Untitled Document");
      let content = "";

      if (file) {
        content = file.buffer.toString("utf-8");
      } else if (req.body.content) {
        content = String(req.body.content);
      } else {
        return res.status(400).json({ error: "No document file or text content provided" });
      }

      // 1. Compute canonical SHA-256 content hash
      const contentHash = computeContentHash(content);

      // 2. Generate unique document ID (bytes32)
      const randomHex = crypto.randomBytes(16).toString("hex");
      const documentId = ethers.keccak256(ethers.toUtf8Bytes(`${title}-${Date.now()}-${randomHex}`));

      // 3. Submit registration transaction to smart contract
      console.log(`Submitting document registration on-chain: ID=${documentId}, hash=${contentHash}`);
      const { txHash, blockNumber } = await blockchain.registerDocument(documentId, contentHash);

      // 4. Save file content off-chain
      const storedPath = storage.saveDocumentFile(documentId, 1, content);

      // 5. Save off-chain metadata
      const initialVersion: DocumentVersionInfo = {
        version: 1,
        contentHash,
        previousHash: ethers.ZeroHash,
        timestamp: Math.floor(Date.now() / 1000),
        txHash,
        blockNumber,
        storedFilePath: storedPath,
      };

      const docRecord: DocumentRecord = {
        id: documentId,
        title,
        originalFilename: file ? file.originalname : `${title}.txt`,
        currentVersion: 1,
        contentHash,
        createdAt: Math.floor(Date.now() / 1000),
        adminAddress: req.user!.address,
        registrationTxHash: txHash,
        registrationBlockNumber: blockNumber,
        versions: [initialVersion],
      };

      storage.saveDocumentRecord(docRecord);

      return res.status(201).json({
        message: "Document successfully registered on-chain",
        document: docRecord,
        transaction: {
          txHash,
          blockNumber,
        },
      });
    } catch (err: any) {
      console.error("Error registering document:", err);
      return res.status(500).json({
        error: "Failed to register document on-chain",
        details: err.message,
      });
    }
  },

  // Add new version to existing document (Admin only)
  addVersion: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const documentId = req.params.id;
      const doc = storage.getDocumentRecord(documentId);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const file = req.file;
      let content = "";
      if (file) {
        content = file.buffer.toString("utf-8");
      } else if (req.body.content) {
        content = String(req.body.content);
      } else {
        return res.status(400).json({ error: "No updated content provided" });
      }

      // Compute new canonical content hash
      const newContentHash = computeContentHash(content);
      const nextVersionNumber = doc.currentVersion + 1;
      const previousHash = doc.contentHash;

      // Submit on-chain version addition
      console.log(`Submitting new version on-chain for doc ${documentId}, version ${nextVersionNumber}`);
      const { txHash, blockNumber } = await blockchain.addVersion(documentId, newContentHash);

      // Save new version file off-chain
      const storedPath = storage.saveDocumentFile(documentId, nextVersionNumber, content);

      // Update metadata
      const newVersionInfo: DocumentVersionInfo = {
        version: nextVersionNumber,
        contentHash: newContentHash,
        previousHash,
        timestamp: Math.floor(Date.now() / 1000),
        txHash,
        blockNumber,
        storedFilePath: storedPath,
      };

      doc.currentVersion = nextVersionNumber;
      doc.contentHash = newContentHash;
      doc.versions.push(newVersionInfo);

      storage.saveDocumentRecord(doc);

      return res.json({
        message: "New version successfully committed on-chain",
        document: doc,
        newVersion: newVersionInfo,
      });
    } catch (err: any) {
      console.error("Error adding version:", err);
      return res.status(500).json({
        error: "Failed to add document version on-chain",
        details: err.message,
      });
    }
  },

  // Get all documents
  getAllDocuments: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const docs = storage.getAllDocuments();
      const user = req.user!;

      // Enrich with current on-chain access permission for the requesting user
      const enrichedDocs = await Promise.all(
        docs.map(async (doc) => {
          let hasAccess = false;
          if (user.role === "admin") {
            hasAccess = true;
          } else {
            hasAccess = await blockchain.hasAccess(doc.id, user.address);
          }
          return {
            ...doc,
            userHasAccess: hasAccess,
          };
        })
      );

      return res.json({ documents: enrichedDocs });
    } catch (err: any) {
      console.error("Error listing documents:", err);
      return res.status(500).json({ error: "Failed to list documents", details: err.message });
    }
  },

  // Get single document by ID
  getDocumentById: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const documentId = req.params.id;
      const doc = storage.getDocumentRecord(documentId);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const user = req.user!;
      const onChainAccess = await blockchain.hasAccess(documentId, user.address);

      return res.json({
        document: doc,
        userHasAccess: user.role === "admin" || onChainAccess,
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to retrieve document", details: err.message });
    }
  },

  // Get document version history
  getVersionHistory: (req: AuthenticatedRequest, res: Response) => {
    const documentId = req.params.id;
    const doc = storage.getDocumentRecord(documentId);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }
    return res.json({
      documentId: doc.id,
      title: doc.title,
      currentVersion: doc.currentVersion,
      versions: doc.versions,
    });
  },

  // Get raw content of a specific version
  getVersionContent: (req: AuthenticatedRequest, res: Response) => {
    const documentId = req.params.id;
    const version = parseInt(req.params.version, 10);
    const content = storage.getDocumentFile(documentId, version);
    if (!content) {
      return res.status(404).json({ error: "Version content not found on server" });
    }
    return res.json({
      documentId,
      version,
      content,
    });
  },
};
