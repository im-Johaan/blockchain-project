import { Request, Response } from "express";
import { blockchain } from "../blockchain/contractClient";
import { eventListener } from "../blockchain/eventListener";

export const blockchainController = {
  // Network and contract status
  getStatus: async (req: Request, res: Response) => {
    try {
      const netStatus = await blockchain.getNetworkStatus();
      const docCount = await blockchain.getDocumentCount();
      const issuanceCount = await blockchain.getIssuanceCount();

      return res.json({
        ...netStatus,
        totalDocuments: docCount,
        totalIssuances: issuanceCount,
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to get blockchain status", details: err.message });
    }
  },

  // Recent blocks for explorer
  getBlocks: async (req: Request, res: Response) => {
    try {
      const limit = parseInt(String(req.query.limit || "10"), 10);
      const blocks = await blockchain.getRecentBlocks(limit);
      return res.json({ blocks });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to query recent blocks", details: err.message });
    }
  },

  // Specific transaction details
  getTransaction: async (req: Request, res: Response) => {
    try {
      const txHash = req.params.txHash;
      const data = await blockchain.getTransactionWithReceipt(txHash);
      if (!data.tx) {
        return res.status(404).json({ error: "Transaction not found on chain" });
      }
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to query transaction", details: err.message });
    }
  },

  // Historical events
  getEvents: async (req: Request, res: Response) => {
    try {
      const fromBlock = parseInt(String(req.query.fromBlock || "0"), 10);
      const events = await eventListener.queryPastEvents(fromBlock);
      return res.json({ events });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to query past events", details: err.message });
    }
  },

  // Document specific audit history
  getDocumentAuditTrail: async (req: Request, res: Response) => {
    try {
      const documentId = req.params.documentId;
      const events = await eventListener.queryPastEvents(0);
      const docEvents = events.filter((ev: any) => {
        if (!ev || !ev.args) return false;
        return ev.args.documentId === documentId;
      });
      return res.json({ documentId, auditTrail: docEvents });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to query document audit trail", details: err.message });
    }
  },
};
