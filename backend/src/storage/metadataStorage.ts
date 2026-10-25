import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ethers } from "ethers";
import { config } from "../config";
import { DocumentRecord, DocumentVersionInfo, User } from "../../../shared/types";

export interface StoredMetadata {
  documents: Record<string, DocumentRecord>;
  users: Record<string, User>;
  verificationLogs: Array<{
    id: string;
    timestamp: number;
    matched: boolean;
    tokenFound: boolean;
    commitment?: string;
    documentId?: string;
    version?: number;
    userAddress?: string;
    notes: string;
  }>;
}

/**
 * Deterministic text canonicalization for hashing and integrity verification.
 * 1. Normalize line endings (\r\n and \r -> \n).
 * 2. Strip trailing whitespace from every line.
 * 3. Strip leading and trailing newlines.
 * 4. Encode as standard UTF-8.
 */
export function canonicalizeText(rawText: string): string {
  return rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

/**
 * Computes deterministic SHA-256 hash of canonicalized content.
 * Returns bytes32 hex string starting with '0x'.
 */
export function computeContentHash(text: string): string {
  const canonical = canonicalizeText(text);
  const hash = crypto.createHash("sha256").update(Buffer.from(canonical, "utf-8")).digest("hex");
  return "0x" + hash;
}

export class StorageService {
  private dbFilePath: string;
  private docsDir: string;
  private data: StoredMetadata;

  constructor() {
    this.docsDir = path.join(config.uploadDir, "documents");
    this.dbFilePath = path.join(config.uploadDir, "metadata.json");

    if (!fs.existsSync(this.docsDir)) {
      fs.mkdirSync(this.docsDir, { recursive: true });
    }

    this.data = this.loadMetadata();
    this.seedDefaultUsers();
  }

  private loadMetadata(): StoredMetadata {
    if (fs.existsSync(this.dbFilePath)) {
      try {
        const raw = fs.readFileSync(this.dbFilePath, "utf-8");
        return JSON.parse(raw);
      } catch (err) {
        console.error("Failed to read metadata file, creating new database:", err);
      }
    }
    return {
      documents: {},
      users: {},
      verificationLogs: [],
    };
  }

  private saveMetadata(): void {
    fs.writeFileSync(this.dbFilePath, JSON.stringify(this.data, null, 2), "utf-8");
  }

  private seedDefaultUsers(): void {
    // Seed default admin and user accounts if not present
    if (Object.keys(this.data.users).length === 0) {
      this.data.users = {
        "admin": {
          id: "user-admin",
          username: "admin",
          address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Hardhat Account #0
          role: "admin",
          createdAt: new Date().toISOString(),
        },
        "alice": {
          id: "user-alice",
          username: "alice",
          address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat Account #2
          role: "user",
          createdAt: new Date().toISOString(),
        },
        "bob": {
          id: "user-bob",
          username: "bob",
          address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Hardhat Account #3
          role: "user",
          createdAt: new Date().toISOString(),
        },
      };
      this.saveMetadata();
    }
  }

  // Document Management
  public saveDocumentFile(documentId: string, version: number, content: string): string {
    const docFolder = path.join(this.docsDir, documentId);
    if (!fs.existsSync(docFolder)) {
      fs.mkdirSync(docFolder, { recursive: true });
    }
    const filePath = path.join(docFolder, `v${version}.txt`);
    fs.writeFileSync(filePath, content, "utf-8");
    return filePath;
  }

  public getDocumentFile(documentId: string, version: number): string | null {
    const filePath = path.join(this.docsDir, documentId, `v${version}.txt`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
    return null;
  }

  public saveDocumentRecord(doc: DocumentRecord): void {
    this.data.documents[doc.id] = doc;
    this.saveMetadata();
  }

  public getDocumentRecord(documentId: string): DocumentRecord | null {
    return this.data.documents[documentId] || null;
  }

  public getAllDocuments(): DocumentRecord[] {
    return Object.values(this.data.documents);
  }

  // User Management
  public getUser(username: string): User | null {
    return this.data.users[username.toLowerCase()] || null;
  }

  public getUserByAddress(address: string): User | null {
    const lower = address.toLowerCase();
    for (const user of Object.values(this.data.users)) {
      if (user.address.toLowerCase() === lower) {
        return user;
      }
    }
    return null;
  }

  public getAllUsers(): User[] {
    return Object.values(this.data.users);
  }

  // Verification Logs
  public addVerificationLog(entry: StoredMetadata["verificationLogs"][0]): void {
    this.data.verificationLogs.unshift(entry);
    if (this.data.verificationLogs.length > 200) {
      this.data.verificationLogs.pop();
    }
    this.saveMetadata();
  }

  public getVerificationLogs() {
    return this.data.verificationLogs;
  }
}

export const storage = new StorageService();
