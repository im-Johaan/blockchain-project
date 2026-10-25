export type UserRole = "admin" | "user";

export interface User {
  id: string;
  username: string;
  address: string;
  role: UserRole;
  createdAt: string;
}

export interface DocumentVersionInfo {
  version: number;
  contentHash: string;
  previousHash: string;
  timestamp: number;
  txHash?: string;
  blockNumber?: number;
  storedFilePath: string;
}

export interface DocumentRecord {
  id: string; // bytes32 hex (starts with 0x)
  title: string;
  originalFilename: string;
  currentVersion: number;
  contentHash: string;
  createdAt: number;
  adminAddress: string;
  registrationTxHash: string;
  registrationBlockNumber: number;
  versions: DocumentVersionInfo[];
}

export interface IssuanceVerificationResult {
  matched: boolean;
  tokenFound: boolean;
  commitment?: string;
  documentId?: string;
  documentTitle?: string;
  version?: number;
  userAddress?: string;
  username?: string;
  timestamp?: number;
  txHash?: string;
  blockNumber?: number;
  extractedTextPreview?: string;
  details: string;
}

export interface BlockchainBlockSummary {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  transactionCount: number;
}

export interface BlockchainTxSummary {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  eventName?: string;
  eventArgs?: Record<string, any>;
  timestamp?: number;
}

export interface AccessPermissionSummary {
  documentId: string;
  userAddress: string;
  username: string;
  hasAccess: boolean;
  updatedAt?: number;
}
