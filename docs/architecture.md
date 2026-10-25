# Architecture Specification: DataLeak Ledger

## 1. System Overview

DataLeak Ledger implements a hybrid architecture combining an EVM-compatible blockchain with off-chain storage, an Express.js API gateway, and a React frontend.

```
+-------------------------------------------------------------------+
|                        React Frontend                             |
|    Admin Dashboard | Document Manager | Access Portal | Forensics |
+---------------------------------+---------------------------------+
                                  | HTTP / JSON-RPC / WebSockets
                                  v
+-------------------------------------------------------------------+
|                     Express.js Backend API                        |
|                                                                   |
|  +--------------------+  +-------------------+  +---------------+ |
|  |  Auth & Middleware |  |  Forensics Engine |  | Storage Layer | |
|  +--------------------+  +-------------------+  +---------------+ |
|             |                     |                     |         |
|             v                     v                     v         |
|       JWT Verification     256-bit CSPRNG /    Canonical SHA-256  |
|                            Zero-Width Unicode   Off-chain Files   |
+---------------------------------+---------------------------------+
                                  | ethers.js v6
                                  v
+-------------------------------------------------------------------+
|                  DataLeakLedger Smart Contract                    |
|                                                                   |
|   - registerDocument(bytes32 docId, bytes32 contentHash)          |
|   - addVersion(bytes32 docId, bytes32 newContentHash)             |
|   - grantAccess(bytes32 docId, address user)                      |
|   - revokeAccess(bytes32 docId, address user)                     |
|   - hasAccess(bytes32 docId, address user) returns (bool)         |
|   - recordIssuance(bytes32 commitment, bytes32 docId, ...)        |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|           Hardhat EVM Local Network (Chain ID: 31337)            |
+-------------------------------------------------------------------+
```

## 2. Source-of-Truth Separation

| Component | Responsibility & Authority |
| :--- | :--- |
| **DataLeakLedger (Smart Contract)** | **Authoritative** for document registration, immutable version hashes, active download permissions, and issuance commitments. |
| **Blockchain (EVM)** | **Authoritative** for block history, transaction receipts, and timestamped audit events. |
| **Local File System** | Storage for original confidential document text (kept off-chain). |
| **Metadata Storage (JSON/PostgreSQL)** | Query-friendly index for document titles, usernames, and forensic verification logs. |

## 3. Data Flow Workflows

### 3.1 Document Registration
1. Administrator uploads plain text or markdown (`.txt`, `.md`).
2. Backend computes canonical SHA-256 content hash:
   $$\text{contentHash} = \text{SHA-256}(\text{Canonicalize}(\text{Text}))$$
3. Backend generates unique `bytes32` identifier.
4. Admin submits `registerDocument(documentId, contentHash)` on-chain.
5. Transaction is mined in a block; event `FileRegistered` is emitted.
6. File is stored in `uploads/documents/<docId>/v1.txt`.

### 3.2 Access Grant & Revocation
1. Admin grants access to user's wallet address (`grantAccess`).
2. Contract sets `_accessPermissions[documentId][user] = true` and emits `AccessGranted`.
3. When admin revokes (`revokeAccess`), contract sets `_accessPermissions[documentId][user] = false` and emits `AccessRevoked`.
4. WebSocket gateway notifies connected clients immediately.

### 3.3 Watermarked Document Issuance
1. Authenticated user requests document download.
2. Backend queries smart contract: `hasAccess(documentId, userAddress)`.
3. If revoked or not granted, backend rejects request with HTTP 403.
4. Backend generates cryptographically secure 256-bit token $T$:
   $$T \leftarrow \text{CSPRNG}(256\text{ bits})$$
5. Backend computes Ethereum Keccak-256 commitment $C$:
   $$C = \text{Keccak-256}(T)$$
6. Backend calls smart contract `recordIssuance(C, docId, version, userAddress)`.
7. Backend confirms transaction receipt.
8. Backend encodes token $T$ into zero-width Unicode characters and embeds them in the document text.
9. Marked PDF/text is returned to the user.

### 3.4 Forensic Attribution
1. Investigator pastes leaked text snippet into Forensic Portal.
2. Parser extracts zero-width framed characters and reconstructs 256-bit token $T$.
3. Parser computes $C = \text{Keccak-256}(T)$.
4. Backend queries contract: `getIssuance(C)`.
5. If found, returns exact document, version, recipient wallet, and mining timestamp.
