import crypto from "crypto";
import { ethers } from "ethers";

export interface IssuanceTokenData {
  /**
   * Cryptographically secure 256-bit (32-byte) random token as a hex string (with 0x prefix).
   * Kept in memory only during document generation and forensic extraction.
   * NEVER stored in plaintext in the database or emitted on-chain.
   */
  tokenHex: string;

  /**
   * Ethereum Keccak-256 hash of the token.
   * This commitment is stored on-chain in DataLeakLedger and in off-chain audit logs.
   */
  commitment: string;
}

/**
 * Generates a cryptographically secure 256-bit issuance token using Node.js crypto CSPRNG.
 * Computes its Ethereum Keccak-256 commitment using ethers.js.
 */
export function generateIssuanceToken(): IssuanceTokenData {
  const tokenBytes = crypto.randomBytes(32);
  const tokenHex = "0x" + tokenBytes.toString("hex");
  const commitment = ethers.keccak256(tokenHex);

  return {
    tokenHex,
    commitment,
  };
}

/**
 * Computes the Keccak-256 commitment of an existing token hex string.
 * Used during forensic leak attribution to match against the blockchain.
 */
export function computeCommitment(tokenHex: string): string {
  const normalized = tokenHex.startsWith("0x") ? tokenHex : "0x" + tokenHex;
  return ethers.keccak256(normalized);
}
