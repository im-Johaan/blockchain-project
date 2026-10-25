import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { extractMarkers, stripZeroWidthCharacters } from "../forensics/encoder";
import { computeCommitment } from "../forensics/token";
import { blockchain } from "../blockchain/contractClient";
import { storage } from "../storage/metadataStorage";
import { IssuanceVerificationResult } from "../../../shared/types";

export const forensicsController = {
  /**
   * Forensic verification endpoint.
   * Extracts embedded zero-width Unicode markers from suspect leaked text,
   * computes their Ethereum Keccak-256 commitments, queries the blockchain
   * registry, and correlates with document and user records.
   */
  verifyLeakedText: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { leakedText } = req.body;
      if (!leakedText || typeof leakedText !== "string") {
        return res.status(400).json({ error: "Text payload 'leakedText' is required for forensic analysis" });
      }

      // 1. Extract and decode zero-width steganographic markers
      const extractedMarkers = extractMarkers(leakedText);
      const cleanTextPreview = stripZeroWidthCharacters(leakedText).slice(0, 150) + "...";

      if (extractedMarkers.length === 0) {
        const noMarkerResult: IssuanceVerificationResult = {
          matched: false,
          tokenFound: false,
          details: "No zero-width forensic markers detected in the provided text. The text may have been manually re-typed, stripped of Unicode non-printable characters, or did not originate from a watermarked issuance.",
          extractedTextPreview: cleanTextPreview,
        };

        storage.addVerificationLog({
          id: `verify-${Date.now()}`,
          timestamp: Math.floor(Date.now() / 1000),
          matched: false,
          tokenFound: false,
          notes: "No zero-width characters found",
        });

        return res.json(noMarkerResult);
      }

      // Check if any marker was malformed
      const validMarkers = extractedMarkers.filter((m) => m.isValid && m.tokenHex);
      if (validMarkers.length === 0) {
        const malformed = extractedMarkers[0];
        const malformedResult: IssuanceVerificationResult = {
          matched: false,
          tokenFound: true,
          details: `Marker found but invalid or corrupted: ${malformed.error || "Bit framing error"}.`,
          extractedTextPreview: cleanTextPreview,
        };

        storage.addVerificationLog({
          id: `verify-${Date.now()}`,
          timestamp: Math.floor(Date.now() / 1000),
          matched: false,
          tokenFound: true,
          notes: `Malformed marker: ${malformed.error}`,
        });

        return res.json(malformedResult);
      }

      // 2. Compute Keccak-256 commitment of the first valid extracted token
      const token = validMarkers[0].tokenHex;
      const commitment = computeCommitment(token);

      console.log(`Verifying extracted commitment on-chain: ${commitment}`);

      // 3. Query the blockchain smart contract for this commitment
      const onChainRecord = await blockchain.getIssuance(commitment);

      if (!onChainRecord || !onChainRecord.exists) {
        const unknownResult: IssuanceVerificationResult = {
          matched: false,
          tokenFound: true,
          commitment,
          details: "A valid zero-width marker structure was extracted, but its commitment was not found in the blockchain issuance registry. The token may be from an unrecorded session or simulated test.",
          extractedTextPreview: cleanTextPreview,
        };

        storage.addVerificationLog({
          id: `verify-${Date.now()}`,
          timestamp: Math.floor(Date.now() / 1000),
          matched: false,
          tokenFound: true,
          commitment,
          notes: "Token not found on blockchain",
        });

        return res.json(unknownResult);
      }

      // 4. Resolve document metadata & user details
      const doc = storage.getDocumentRecord(onChainRecord.documentId);
      const user = storage.getUserByAddress(onChainRecord.user);

      // Find the issuance transaction hash if recorded in events or query
      const matchResult: IssuanceVerificationResult = {
        matched: true,
        tokenFound: true,
        commitment,
        documentId: onChainRecord.documentId,
        documentTitle: doc ? doc.title : "Unknown Document",
        version: onChainRecord.version,
        userAddress: onChainRecord.user,
        username: user ? user.username : "External Account",
        timestamp: onChainRecord.timestamp,
        extractedTextPreview: cleanTextPreview,
        details: "Cryptographic commitment successfully matched in DataLeakLedger smart contract on-chain registry.",
      };

      storage.addVerificationLog({
        id: `verify-${Date.now()}`,
        timestamp: Math.floor(Date.now() / 1000),
        matched: true,
        tokenFound: true,
        commitment,
        documentId: onChainRecord.documentId,
        version: onChainRecord.version,
        userAddress: onChainRecord.user,
        notes: `Matched document ${onChainRecord.documentId} v${onChainRecord.version} issued to ${onChainRecord.user}`,
      });

      return res.json(matchResult);
    } catch (err: any) {
      console.error("Forensic analysis error:", err);
      return res.status(500).json({
        error: "Forensic verification encountered an unexpected error",
        details: err.message,
      });
    }
  },

  getVerificationHistory: (req: AuthenticatedRequest, res: Response) => {
    return res.json({ logs: storage.getVerificationLogs() });
  },
};
