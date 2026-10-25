import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { storage } from "../storage/metadataStorage";
import { blockchain } from "../blockchain/contractClient";
import { generateIssuanceToken } from "../forensics/token";
import { generateWatermarkedPdf, generateWatermarkedText } from "../watermark/pdfGenerator";

export const downloadController = {
  /**
   * Secure watermarked document download handler.
   * Verifies current on-chain permission, records unique issuance commitment on the blockchain,
   * waits for receipt confirmation, embeds zero-width steganographic token, and serves the file.
   */
  downloadDocument: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const documentId = req.params.id;
      const user = req.user!;
      const requestedVersion = req.query.version
        ? parseInt(String(req.query.version), 10)
        : null;
      const format = (String(req.query.format || "pdf")).toLowerCase();

      // 1. Resolve document
      const doc = storage.getDocumentRecord(documentId);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const versionToIssue = requestedVersion || doc.currentVersion;
      if (versionToIssue <= 0 || versionToIssue > doc.currentVersion) {
        return res.status(400).json({ error: `Invalid version ${versionToIssue}. Current version is ${doc.currentVersion}` });
      }

      // 2. Check CURRENT on-chain permission (Backend MUST check contract state)
      const hasOnChainPermission = await blockchain.hasAccess(documentId, user.address);
      if (!hasOnChainPermission && user.role !== "admin") {
        return res.status(403).json({
          error: "Access Denied: Current on-chain smart contract permission is revoked or not granted for your wallet address",
          documentId,
          userAddress: user.address,
        });
      }

      // If admin is downloading without explicit grant, grant temporarily or verify
      let downloadUserAddress = user.address;

      // If user is admin but not in access list on-chain, ensure admin has access for issuance recording
      if (user.role === "admin" && !hasOnChainPermission) {
        await blockchain.grantAccess(documentId, user.address);
      }

      // 3. Read source text of the requested version
      const content = storage.getDocumentFile(documentId, versionToIssue);
      if (!content) {
        return res.status(500).json({ error: "Document content file missing for requested version" });
      }

      // 4. Generate cryptographically secure 256-bit issuance token & Keccak-256 commitment
      const { tokenHex, commitment } = generateIssuanceToken();

      // 5. Submit issuance commitment to blockchain (DataLeakLedger.sol)
      console.log(`Recording issuance commitment on-chain: doc=${documentId}, ver=${versionToIssue}, user=${downloadUserAddress}`);
      const { txHash, blockNumber } = await blockchain.recordIssuance(
        commitment,
        documentId,
        versionToIssue,
        downloadUserAddress
      );

      // Verify that transaction mined successfully
      if (!txHash || blockNumber === null || blockNumber === undefined) {
        return res.status(500).json({ error: "Blockchain issuance recording transaction failed or was rejected" });
      }

      const issuedAt = new Date().toISOString();

      // 6. Generate marked file and return to client
      if (format === "txt" || format === "text" || format === "md") {
        const markedText = generateWatermarkedText(content, tokenHex);
        const filename = `${doc.title.replace(/\s+/g, "_")}_v${versionToIssue}_issued.txt`;

        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("X-Issuance-Tx", txHash);
        res.setHeader("X-Issuance-Block", String(blockNumber));
        return res.send(markedText);
      } else {
        // Generate PDF
        const pdfBuffer = await generateWatermarkedPdf({
          title: doc.title,
          version: versionToIssue,
          content,
          tokenHex,
          documentId,
          userAddress: downloadUserAddress,
          issuedAt,
        });

        const filename = `${doc.title.replace(/\s+/g, "_")}_v${versionToIssue}_issued.pdf`;
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("X-Issuance-Tx", txHash);
        res.setHeader("X-Issuance-Block", String(blockNumber));
        return res.send(pdfBuffer);
      }
    } catch (err: any) {
      console.error("Download error:", err);
      return res.status(500).json({
        error: "Failed to process document download",
        details: err.message,
      });
    }
  },
};
