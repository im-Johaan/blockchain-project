# Security Architecture & Threat Model

## 1. Security Objectives

DataLeak Ledger enforces two primary security objectives:
1. **Tamper-Evident Document Audit Trail:** Ensuring that historical document registrations, versions, and permission changes cannot be altered or backdated without detection.
2. **Forensic Attribution Accountability:** Ensuring that every issued copy of a document is cryptographically bound to a unique issuance commitment stored immutably on-chain.

## 2. Threat Model & Trust Assumptions

### 2.1 What the System Protects Against
- **Privileged Database Tampering:** If a malicious system administrator modifies an access log in PostgreSQL or changes a document file in off-chain storage, comparing the file's canonical hash with the on-chain SHA-256 fingerprint immediately exposes the tampering.
- **Unauthorized Downloads:** Even if an authorized user attempts to bypass front-end controls, the backend queries the smart contract's `hasAccess(docId, user)` state before serving the download. If revoked, the download is denied.
- **Repudiation of Issuance:** An authorized user cannot claim that a leaked copy bearing their embedded commitment was never issued to them, because the commitment was mined on-chain alongside their wallet address and timestamp.

### 2.2 Trust Assumptions & Limitations
- **Authorized Backend Issuer:** The backend issuer wallet holds `ISSUER_ROLE`. The system trusts the backend not to record fictitious issuances for unauthorized addresses.
- **Off-Chain Storage:** Confidential document content is stored off-chain. If off-chain files are destroyed, the blockchain retains the proof of their existence and content hash, but cannot reconstruct the original text.
- **Physical Leakage Vectors:** Zero-width Unicode characters protect against digital copy-paste and forward-sharing. They do **not** protect against:
  - Optical screen photography.
  - Manual character-by-character retyping.
  - Text normalization tools that filter non-printable Unicode code points (`[\u200B-\u200D\uFEFF\u2060]`).

## 3. Cryptographic Key & Secret Management

- **No Raw Token Exposure:** 256-bit issuance tokens are generated in volatile memory via Node.js CSPRNG, embedded into the text, and discarded. Only the Keccak-256 commitment is ever logged, stored in databases, or submitted to the blockchain.
- **Private Key Isolation:** Private keys for the Administrator and Issuer accounts are loaded from secure server-side environment variables and never exposed to the frontend.
- **Local Dev vs. Production Keys:** The private keys included in `.env.example` are standard, well-known Hardhat local testing keys. They must never be funded or used on public Ethereum networks.
