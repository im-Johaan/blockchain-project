import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { storage } from "../storage/metadataStorage";
import { blockchain } from "../blockchain/contractClient";

export const accessController = {
  // Grant access (Admin only)
  grantAccess: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const documentId = req.params.id;
      const { userAddress, username } = req.body;

      let targetAddress = userAddress;
      if (!targetAddress && username) {
        const user = storage.getUser(username);
        if (!user) {
          return res.status(404).json({ error: `User '${username}' not found` });
        }
        targetAddress = user.address;
      }

      if (!targetAddress) {
        return res.status(400).json({ error: "User address or username is required" });
      }

      console.log(`Granting on-chain access to ${targetAddress} for document ${documentId}`);
      const { txHash, blockNumber } = await blockchain.grantAccess(documentId, targetAddress);

      return res.json({
        message: "Access successfully granted on-chain",
        documentId,
        userAddress: targetAddress,
        transaction: {
          txHash,
          blockNumber,
        },
      });
    } catch (err: any) {
      console.error("Error granting access:", err);
      return res.status(500).json({
        error: "Failed to grant access on-chain",
        details: err.message,
      });
    }
  },

  // Revoke access (Admin only)
  revokeAccess: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const documentId = req.params.id;
      const targetUserParam = req.params.userId;

      let targetAddress = targetUserParam;
      // If parameter is a username rather than address
      if (!targetAddress.startsWith("0x")) {
        const user = storage.getUser(targetUserParam);
        if (user) {
          targetAddress = user.address;
        }
      }

      console.log(`Revoking on-chain access from ${targetAddress} for document ${documentId}`);
      const { txHash, blockNumber } = await blockchain.revokeAccess(documentId, targetAddress);

      return res.json({
        message: "Access successfully revoked on-chain",
        documentId,
        userAddress: targetAddress,
        transaction: {
          txHash,
          blockNumber,
        },
      });
    } catch (err: any) {
      console.error("Error revoking access:", err);
      return res.status(500).json({
        error: "Failed to revoke access on-chain",
        details: err.message,
      });
    }
  },

  // Get access permissions for a document
  getDocumentAccessList: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const documentId = req.params.id;
      const doc = storage.getDocumentRecord(documentId);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const allUsers = storage.getAllUsers();
      const accessList = await Promise.all(
        allUsers.map(async (u) => {
          const hasAccess = await blockchain.hasAccess(documentId, u.address);
          return {
            userId: u.id,
            username: u.username,
            address: u.address,
            role: u.role,
            hasAccess,
          };
        })
      );

      return res.json({
        documentId,
        permissions: accessList,
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to query access list", details: err.message });
    }
  },
};
