# DataLeak Ledger: Blockchain Audit & Forensic Steganography Platform

> **Academic Project Submission & Comprehensive Technical Viva Reference**  
> **Course:** Blockchain Architecture, Smart Contracts & Information Security  
> **Domain:** Decentralized Systems, Cryptographic Auditing & Steganography  

---

## Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Why Blockchain & Smart Contracts? (Core Architecture)](#2-why-blockchain--smart-contracts-core-architecture)
   - [2.1 The Failure of Centralized Databases](#21-the-failure-of-centralized-databases)
   - [2.2 Smart Contract as the Authoritative State Machine](#22-smart-contract-as-the-authoritative-state-machine)
   - [2.3 Smart Contract Implementation Details (`DataLeakLedger.sol`)](#23-smart-contract-implementation-details-dataleakledgersol)
   - [2.4 Gas and Storage Economics: On-Chain vs. Off-Chain](#24-gas-and-storage-economics-on-chain-vs-off-chain)
3. [The Complete Security Architecture ("How We Did the Security Thing")](#3-the-complete-security-architecture-how-we-did-the-security-thing)
   - [3.1 Phase 1: Deterministic Content Canonicalization](#31-phase-1-deterministic-content-canonicalization)
   - [3.2 Phase 2: Cryptographic Issuance Token Generation & Commitment Scheme](#32-phase-2-cryptographic-issuance-token-generation--commitment-scheme)
   - [3.3 Phase 3: Zero-Width Unicode Forensic Steganography](#33-phase-3-zero-width-unicode-forensic-steganography)
   - [3.4 Phase 4: Atomic On-Chain Permission Enforcement & Issuance Recording](#34-phase-4-atomic-on-chain-permission-enforcement--issuance-recording)
   - [3.5 Phase 5: Forensic Extraction & Attribution Pipeline](#35-phase-5-forensic-extraction--attribution-pipeline)
   - [3.6 Phase 6: Threat Model, Guarantees & Limitations](#36-phase-6-threat-model-guarantees--limitations)
4. [Step-by-Step Presentation Guide for Evaluator / Viva ("Presenting to Ma'am")](#4-step-by-step-presentation-guide-for-evaluator--viva-presenting-to-maam)
   - [Presentation Script & Slide Structure](#presentation-script--slide-structure)
   - [Live Demonstration Workflow (7 Steps)](#live-demonstration-workflow-7-steps)
   - [High-Yield Viva Q&A Cheat Sheet](#high-yield-viva-qa-cheat-sheet)
5. [System Architecture & Technology Stack](#5-system-architecture--technology-stack)
6. [Quick Start & Setup Instructions](#6-quick-start--setup-instructions)
7. [Automated Test Suite (26 Passing Tests)](#7-automated-test-suite-26-passing-tests)
8. [License & Academic Integrity](#8-license--academic-integrity)

---

## 1. Executive Summary & Problem Statement

In enterprise environments (legal, healthcare, defence, corporate governance), confidential documents are continuously created, amended, and distributed. Current access management platforms suffer from **two fundamental security vulnerabilities**:

```
+---------------------------------------------------------------------------------------------------+
|                                  THE TRADITIONAL SECURITY PARADOX                                 |
+---------------------------------------------------------------------------------------------------+
|  1. THE ROGUE ADMIN PROBLEM (Log Tampering)                                                       |
|     Traditional systems store audit logs in SQL/NoSQL databases. A privileged database            |
|     administrator (DBA) or an attacker with root privileges can silently execute:                 |
|     `UPDATE audit_logs SET user_id='bob' WHERE id=101;` or `DELETE FROM audit_logs;`             |
|     Result: Access logs are NOT tamper-evident and provide NO true non-repudiation.               |
|                                                                                                   |
|  2. THE COPY-PASTE LEAK ATTRIBUTION PROBLEM (Text Exfiltration)                                   |
|     When an authorized user opens a sensitive document (e.g. merger proposal, financial results)  |
|     and copies a paragraph of text into an email, WhatsApp, or public forum, visual watermarks   |
|     (stamps, headers) are completely discarded.                                                   |
|     Result: Standard access logs show who downloaded the file, but CANNOT prove which specific    |
|     issued copy the leaked text snippet originated from.                                          |
+---------------------------------------------------------------------------------------------------+
```

### The DataLeak Ledger Solution
DataLeak Ledger integrates **EVM-based smart contracts** with **zero-width Unicode steganography**:
1. **Decentralized Audit Trail:** Document hashes, immutable version histories, permission grants/revocations, and issuance commitments are recorded on an Ethereum smart contract (`DataLeakLedger.sol`). No administrator can alter or delete this history.
2. **Invisible Forensic Fingerprinting:** Every time an authorized user downloads a document, the server generates a cryptographically random 256-bit token, records its Keccak-256 commitment on the blockchain, and encodes the token into invisible Unicode characters embedded directly inside the text body.
3. **Provable Leak Attribution:** If text is copied and leaked, our forensic engine extracts the invisible marker, computes its Keccak-256 hash, and queries the smart contract to identify the exact recipient wallet address, document version, block number, and issuance timestamp.

---

## 2. Why Blockchain & Smart Contracts? (Core Architecture)

### 2.1 The Failure of Centralized Databases
In conventional architectures (e.g. Node.js + PostgreSQL):
- The database is controlled by a single operational entity.
- Timestamps can be backdated (`block.timestamp` in Ethereum is sealed by the miner/validator network).
- Rows can be updated or dropped without cryptographic proof of mutation.
- Relational databases provide *internal consistency*, but **zero mathematical proof of external integrity**.

By using a blockchain, every state transition is:
1. **Cryptographically Signed:** Produced by an authorized signer using ECDSA (`secp256k1`).
2. **Chained by Hashes:** Every block contains the Merkle root of transactions and the cryptographic hash of the prior block (`parentHash`). Tampering with block $N$ invalidates all subsequent blocks $N+1 \dots N+k$.
3. **Deterministic & Immutable:** EVM bytecode execution is deterministic. Once a transaction receipt is mined with `status == 1`, its execution result is permanent.

---

### 2.2 Smart Contract as the Authoritative State Machine
In DataLeak Ledger, **the smart contract is the supreme authority**, NOT the backend database.
- The backend Express.js server and local metadata storage act solely as **off-chain caches and indexing layers**.
- If the off-chain database is wiped or corrupted, the complete state of document registrations, version history, access permissions, and issuance records can be **fully reconstructed directly by replaying smart contract events**.
- Before any file download is initiated, the backend **must execute a live RPC call** to `hasAccess(documentId, userAddress)` on the smart contract. An off-chain permission flag is never trusted blindly.

---

### 2.3 Smart Contract Implementation Details (`DataLeakLedger.sol`)

The contract `contracts/DataLeakLedger.sol` is written in **Solidity `^0.8.24`** and inherits from **OpenZeppelin's `AccessControl`**:

```
                                  +-----------------------+
                                  |     AccessControl     |
                                  |    (OpenZeppelin)     |
                                  +-----------+-----------+
                                              |
                                              v
                              +-------------------------------+
                              |       DataLeakLedger          |
                              +-------------------------------+
                              | Roles:                        |
                              |  - DEFAULT_ADMIN_ROLE         |
                              |  - ADMIN_ROLE                 |
                              |  - ISSUER_ROLE                |
                              +-------------------------------+
                              | Data Structures:              |
                              |  - DocumentRecord             |
                              |  - DocumentVersion            |
                              |  - IssuanceRecord             |
                              +-------------------------------+
```

#### Core Data Structures
```solidity
struct DocumentVersion {
    bytes32 contentHash;      // Canonical SHA-256 of document content
    bytes32 previousHash;     // Cryptographic link to previous version hash
    uint256 timestamp;        // Block timestamp when version was sealed
}

struct DocumentRecord {
    bytes32 documentId;       // Unique bytes32 document identifier
    address admin;            // Administrator who registered the document
    uint256 createdAt;        // Registration timestamp
    uint256 currentVersion;   // Incremental version counter (1, 2, 3...)
    bool exists;              // Guard against uninitialized queries
}

struct IssuanceRecord {
    bytes32 commitment;       // Keccak-256 hash of the 256-bit issuance token
    bytes32 documentId;       // Document identifier issued
    uint256 version;          // Exact version issued
    address user;             // Recipient wallet address
    uint256 timestamp;        // Block timestamp when issuance was mined
    bool exists;              // Existence flag
}
```

#### Key Smart Contract Functions
1. **`registerDocument(bytes32 documentId, bytes32 contentHash)`**
   - Enforces `onlyRole(ADMIN_ROLE)`.
   - Rejects zero-value identifiers or zero hashes (`revert InvalidIdentifier()` / `revert InvalidContentHash()`).
   - Rejects duplicate IDs (`revert DocumentAlreadyExists(documentId)`).
   - Initializes Version 1 with `previousHash = bytes32(0)`.
   - Emits event `FileRegistered(documentId, contentHash, msg.sender, block.timestamp)`.

2. **`addVersion(bytes32 documentId, bytes32 newContentHash)`**
   - Enforces `onlyRole(ADMIN_ROLE)`.
   - Requires existing document; increments `currentVersion`.
   - Stores `newContentHash` and links it to previous version's `contentHash`.
   - **Never overwrites historical version structs**; historical records remain immutable on-chain.
   - Emits event `VersionAdded(documentId, nextVersion, newContentHash, previousHash, msg.sender, block.timestamp)`.

3. **`grantAccess(bytes32 documentId, address user)` & `revokeAccess(bytes32 documentId, address user)`**
   - Scoped strictly to `(documentId, user)`.
   - Dynamically mutates `_accessPermissions[documentId][user] = true / false`.
   - Emits `AccessGranted` and `AccessRevoked` events.

4. **`hasAccess(bytes32 documentId, address user) external view returns (bool)`**
   - Provides a constant-time $O(1)$ view check used by the backend before serving downloads.

5. **`recordIssuance(bytes32 issuanceCommitment, bytes32 documentId, uint256 version, address user)`**
   - Enforces `onlyRole(ISSUER_ROLE)`.
   - Validates that `issuanceCommitment != bytes32(0)` and commitment has never been used before (`revert CommitmentAlreadyExists()`).
   - Validates that `version > 0 && version <= currentVersion`.
   - **Crucial Security Check:** Requires `_accessPermissions[documentId][user] == true`. If access has been revoked, the transaction reverts with `revert AccessDenied(documentId, user)`.
   - Emits `IssuanceRecorded(issuanceCommitment, documentId, version, user, block.timestamp)`.

#### Gas Optimizations
- **Custom Errors instead of Revert Strings:** In Solidity 0.8.24, custom errors (e.g. `error AccessDenied(bytes32, address)`) compile to a 4-byte selector (`0xeb06a237`), saving significant deployment and execution gas compared to storing dynamic UTF-8 revert strings (`"Error: Access is denied for user"`).
- **Indexed Event Parameters:** All primary lookup keys (`documentId`, `issuanceCommitment`, `user`, `admin`) are declared `indexed` to enable sub-millisecond EVM Bloom filter log filtering.

---

### 2.4 Gas and Storage Economics: On-Chain vs. Off-Chain

| Concern | Putting Raw Document on Blockchain | DataLeak Ledger Architecture (Our Approach) |
| :--- | :--- | :--- |
| **Storage Mechanism** | EVM Storage (`SSTORE` opcode) | Off-Chain Storage (`uploads/`) + On-Chain SHA-256 Hash |
| **Cost (Gas)** | Extremely expensive (~20,000 gas per 32-byte word; 1MB $\approx$ 640 million gas) | Fixed cost: One 32-byte hash (`bytes32`), ~45,000 gas total |
| **Confidentiality** | **Fatal Flaw:** All EVM state is public to any node operator | **Secure:** Raw document content is NEVER exposed to the blockchain |
| **Integrity Verification** | Direct retrieval from chain | Recomputing SHA-256 off-chain and comparing with on-chain hash |

---

## 3. The Complete Security Architecture ("How We Did the Security Thing")

```
                               THE 6-PHASE SECURITY LIFECYCLE
                               
 [1. UPLOAD]           Raw Text ---> Deterministic Canonicalization ---> SHA-256 Fingerprint
                                                                                |
                                                                        [On-Chain Register]
                                                                                |
 [2. PERMISSION]       Admin Grants Access On-Chain (grantAccess) <-------------+
                               |
 [3. DOWNLOAD]         User requests download ---> Live Contract hasAccess() Check
                               |
                               +---> 256-bit CSPRNG Token (T) ---> Keccak-256 Commitment (C)
                                                                                |
                                                                        [On-Chain Record]
                                                                                |
 [4. STEGANOGRAPHY]    T mapped to Zero-Width Unicode (\u200B, \u200C) <--------+
                       Embedded invisibly into Paragraph Boundaries
                               |
 [5. EXFILTRATION]     Leaked text pasted into Forensic Portal
                               |
 [6. FORENSIC MATCH]   Parser extracts 258 chars ---> Rebuilds T ---> Computes C
                       Smart Contract queries getIssuance(C) ---> Identified Wallet & Tx
```

---

### 3.1 Phase 1: Deterministic Content Canonicalization
A cryptographic hash function is sensitive to even a single bit change (the *Avalanche Effect*). In practice:
- Windows saves text with Carriage Return + Line Feed (`\r\n`).
- macOS and Linux save text with Line Feed (`\n`).
- Text editors often add invisible trailing whitespace at the end of lines.

If two different machines compute the hash of the "same" document text, different line endings would result in different hashes. To prevent this, our backend implements **deterministic canonicalization** before hashing:

```typescript
export function canonicalizeText(rawText: string): string {
  return rawText
    .replace(/\r\n/g, "\n")    // Standardize Windows newlines
    .replace(/\r/g, "\n")      // Standardize classic Mac newlines
    .split("\n")
    .map((line) => line.trimEnd()) // Strip trailing line whitespace
    .join("\n")
    .trim();                   // Strip leading and trailing document newlines
}

export function computeContentHash(text: string): string {
  const canonical = canonicalizeText(text);
  return "0x" + crypto.createHash("sha256").update(Buffer.from(canonical, "utf-8")).digest("hex");
}
```
**Security Guarantee:** Regardless of whether the user edits the document on Windows, Linux, or macOS, the canonical SHA-256 fingerprint remains identical. If any word or punctuation is tampered with, the hash changes completely.

---

### 3.2 Phase 2: Cryptographic Issuance Token Generation & Commitment Scheme

When an authorized user downloads a document, the server generates a fresh **Cryptographically Secure Pseudo-Random Number (CSPRNG)** token:
- Token size: **256 bits (32 bytes)**.
- Generated using Node.js `crypto.randomBytes(32)` (backed by OS entropy `/dev/urandom` or hardware RNG).
- We **never** use `Math.random()` (which is predictable PRNG).

$$T \leftarrow \text{CSPRNG}(256\text{ bits})$$

We then compute its **Ethereum Keccak-256 Commitment**:

$$C = \text{Keccak-256}(T)$$

```typescript
export function generateIssuanceToken(): IssuanceTokenData {
  const tokenBytes = crypto.randomBytes(32);
  const tokenHex = "0x" + tokenBytes.toString("hex");
  const commitment = ethers.keccak256(tokenHex);
  return { tokenHex, commitment };
}
```

#### Why We Use a Commitment Scheme (Zero-Knowledge Attribution)
**Question Ma'am Might Ask:** *"Why don't you store the token directly in the database or on the blockchain?"*
- **The Threat:** If the raw token $T$ were stored in the database or emitted in a blockchain transaction, any rogue developer, DBA, or blockchain explorer user could read $T$, generate fake text, embed $T$, and falsely frame an innocent employee.
- **Our Defense:** We store **only the commitment $C$** on-chain. Because Keccak-256 is a **pre-image resistant one-way cryptographic hash function**, it is computationally impossible ($2^{256}$ operations) to derive $T$ from $C$.
- The raw token $T$ exists **only inside the issued document copy itself**. Only when someone presents the leaked text can $T$ be revealed, hashed to $C$, and verified against the on-chain registry.

---

### 3.3 Phase 3: Zero-Width Unicode Forensic Steganography

To make the watermark survive text copy-pasting, we encode the 256-bit token into **Zero-Width Unicode Characters**. These code points are defined in the Unicode standard as non-printing control characters with zero display width.

#### Character Mapping Table
| Unicode Code Point | Name | Binary / Framing Role | Visual Appearance |
| :--- | :--- | :--- | :--- |
| `\uFEFF` | Zero Width No-Break Space (BOM) | **START Frame Delimiter** | *Completely Invisible* |
| `\u200B` | Zero Width Space | **Bit `0`** | *Completely Invisible* |
| `\u200C` | Zero Width Non-Joiner (ZWNJ) | **Bit `1`** | *Completely Invisible* |
| `\u2060` | Word Joiner | **END Frame Delimiter** | *Completely Invisible* |

#### Encoding Process
1. Clean 64-character hex string of token $T$ (32 bytes = 256 bits).
2. For each byte, iterate through all 8 bits from MSB (bit 7) to LSB (bit 0).
3. If bit is `0`, append `\u200B`. If bit is `1`, append `\u200C`.
4. Wrap with `\uFEFF` at the start and `\u2060` at the end:
   $$\text{Marker Frame} = \underbrace{\text{\textbackslash uFEFF}}_{\text{START}} + \underbrace{\{ \text{\textbackslash u200B} \mid \text{\textbackslash u200C} \}^{256}}_{256\text{ Bits of Data}} + \underbrace{\text{\textbackslash u2060}}_{\text{END}}$$
5. Frame length: Exactly **258 Unicode characters** (1 start + 256 bits + 1 end).

#### Multi-Paragraph Repetition Strategy
If the watermark were placed only once at the end of the file, a leaker who copies only Paragraph 2 would bypass attribution.  
Our encoder splits the document by paragraph boundaries (`\n\n`) and **embeds a complete 258-character framed marker at the end of each paragraph**:
- If the recipient copies the entire document $\rightarrow$ 100% recovered.
- If the recipient copies **only a single paragraph** $\rightarrow$ The complete 258-character marker is still fully recovered.

---

### 3.4 Phase 4: Atomic On-Chain Permission Enforcement & Issuance Recording

The document download route (`/api/documents/:id/download`) follows strict atomic verification:

```
User clicks "Download"
         |
         v
1. Authenticate Request via JWT Bearer Token
         |
         v
2. Call Smart Contract: hasAccess(documentId, userAddress)
         |
   [Access Denied?] --------YES-------> Reject immediately with HTTP 403 Forbidden
         | NO (Authorized)
         v
3. Generate fresh CSPRNG Token (T) and compute Commitment (C)
         |
         v
4. Send on-chain transaction: recordIssuance(C, docId, version, userAddress)
         |
5. Await transaction receipt confirmation from EVM (receipt.status == 1)
         |
   [Tx Reverted?] ----------YES-------> Reject download, do not emit file
         | NO (Mined)
         v
6. Embed Token (T) into text using zero-width Unicode steganography
         |
         v
7. Stream watermarked PDF or Text file with headers:
   X-Issuance-Tx: <txHash>
   X-Issuance-Block: <blockNumber>
```

**Key Security Rule:** The backend **never** delivers the watermarked file until the issuance commitment transaction has been confirmed and sealed into a block.

---

### 3.5 Phase 5: Forensic Extraction & Attribution Pipeline

When leaked text is pasted into the Forensic Portal:
1. **Delimiter Scanning:** The parser scans the text for the `\uFEFF` start character.
2. **Frame Boundary Detection:** It locates the corresponding `\u2060` end character.
3. **Bit Reconstruction:**
   - Any character equal to `\u200B` is parsed as binary `'0'`.
   - Any character equal to `\u200C` is parsed as binary `'1'`.
   - If unexpected characters exist inside the frame or bit count $\neq 256$, it flags a **malformed or corrupted marker**.
4. **Token Assembly:** Every 8 bits are converted into a byte, yielding the 32-byte hex token $T$.
5. **Commitment Hashing:** The engine computes:
   $$C = \text{Keccak-256}(T)$$
6. **Smart Contract Lookup:** The engine calls `DataLeakLedger.getIssuance(C)`.
7. **Attribution Corroboration:** The contract returns:
   - `documentId`: Identifies the exact document leaked.
   - `version`: Identifies the exact version issued.
   - `user`: Identifies the Ethereum wallet address of the recipient.
   - `timestamp`: The exact block timestamp when the file was downloaded.

---

### 3.6 Phase 6: Threat Model, Guarantees & Limitations

#### What DataLeak Ledger Mathematically Guarantees
- **Non-Repudiation of Registration:** An admin cannot deny registering a document version; the registration transaction is permanently signed by their private key.
- **Tamper Detection:** If an attacker modifies the off-chain file content by even one character, `SHA-256(file) != onChainHash`.
- **Proof of Authorized Issuance:** A user cannot deny receiving an issued copy; the commitment was sealed on-chain alongside their wallet address.
- **Digital Copy-Paste Traceability:** Text copied directly from the watermarked document retains the zero-width markers.

#### System Scope & Limitations (Important for Viva Defense)
- **The Analog Hole:** If someone uses a physical camera to photograph a computer screen or manually re-types the text word-by-word on another keyboard, zero-width characters are not captured.
- **Text Normalization / Regex Stripping:** If an attacker explicitly pipes text through a script like `text.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '')`, the invisible watermark is removed.
- **Compromised Endpoints:** The system proves that a copy was issued to **Alice's wallet address**; it cannot mathematically prove whether Alice's laptop was stolen by an unauthorized third party.

---

## 4. Step-by-Step Presentation Guide for Evaluator / Viva ("Presenting to Ma'am")

When presenting this project to your professor or viva committee, follow this structured, confident walkthrough:

### Presentation Script & Slide Structure

#### Step 1: Introduce the Real-World Problem (2 Minutes)
> *"Good morning, Ma'am. In enterprise systems today, sensitive documents like board resolutions, acquisition memos, and patient records are stored on centralized cloud servers. This presents two major security flaws:*  
> *First, privileged database administrators can silently modify access logs, so traditional logs fail to provide non-repudiation.*  
> *Second, when an authorized user simply copies text out of a confidential file and leaks it onto social media or in an email, visual watermarks disappear and conventional logs cannot prove which specific copy was leaked.*  
> *Our project, **DataLeak Ledger**, solves this by combining **Ethereum smart contracts** for tamper-proof audit trails with **zero-width Unicode steganography** for forensic leak attribution."*

#### Step 2: Explain the Smart Contract & Decentralized Role (3 Minutes)
> *"We built our smart contract, `DataLeakLedger.sol`, in Solidity 0.8.24 using OpenZeppelin Access Control. Rather than storing large document contents on-chain—which would be prohibitively expensive and violate enterprise confidentiality—we store 32-byte cryptographic fingerprints:*  
> *1. Canonical SHA-256 hashes of document contents.*  
> *2. An immutable version tree where each new version links back to the previous version's hash.*  
> *3. Dynamic access permissions mapped to individual wallet addresses.*  
> *4. Keccak-256 issuance commitments.*  
> *The smart contract is the authoritative single source of truth. The backend enforces on-chain permission checks directly against the EVM before every download."*

#### Step 3: Explain the Forensic Steganography & Security Pipeline (3 Minutes)
> *"When a user downloads a document:*  
> *First, the backend checks the user's on-chain permission.*  
> *Second, we generate a fresh 256-bit cryptographically secure random token using Node.js CSPRNG.*  
> *Third, we take its Keccak-256 hash and submit it as an issuance commitment to the smart contract.*  
> *Fourth, we convert the 256-bit token into invisible zero-width Unicode characters: `\u200B` for bit 0 and `\u200C` for bit 1, enclosed in start and end framing delimiters.*  
> *We embed these invisible markers at paragraph boundaries. The text looks completely normal to a human reader, but if an authorized user copy-pastes any paragraph into an unauthorized leak, the 256-bit token is preserved.*  
> *In our Forensic Portal, an investigator pastes the leaked text. The parser extracts the token, computes its Keccak-256 hash, queries the smart contract, and attributes the leak directly to the recipient's wallet address and block number."*

---

### Live Demonstration Workflow (7 Steps)

Follow these exact steps during your screen-share demo:

```
 DEMO SEQUENCE:
 1. Login as Admin  --->  2. Upload Document  --->  3. Grant Access to Alice
                                                          |
 4. Login as Alice  <---  Download Watermarked Text <-----+
         |
 5. Simulate Leak (Copy text snippet)
         |
 6. Login as Admin  --->  Forensic Portal Paste  --->  POSITIVE ATTRIBUTION MATCH
         |
 7. Revoke Access   --->  Login as Alice  --->  Download Attempt BLOCKED (HTTP 403)
```

1. **Step 1: Open the Application & Login as Admin**
   - Navigate to `http://localhost:5173`.
   - On the Login page, click the quick-login button: **"Admin (Registrar)"**.
   - Show the **Security & Audit Overview** dashboard displaying live metrics directly from the smart contract.

2. **Step 2: Register a Document On-Chain**
   - Click **Document Registry** in the sidebar.
   - Enter title: `Acquisition M&A Strategy Policy`.
   - Select the included file `sample-policy.md` (or paste text).
   - Click **Register On-Chain**.
   - Show the evaluator the mined transaction hash and block number.
   - Show that the document's canonical SHA-256 fingerprint is recorded.

3. **Step 3: Grant Access to Alice**
   - Navigate to **Access Control**.
   - Select the newly registered document from the dropdown.
   - In the permissions table, find **Alice** (wallet `0x3C44...93BC`).
   - Click **Grant Access**.
   - Point out that this submits a real Ethereum transaction calling `grantAccess()` on `DataLeakLedger.sol`.

4. **Step 4: Download as Alice**
   - Click the logout icon and log in as **Alice**.
   - Navigate to **Document Portal**.
   - Point out that the document status shows **ACCESS GRANTED**.
   - Click **Text (.txt)** or **Download PDF**.
   - Explain to Ma'am: *"The backend just verified Alice's permission on-chain, generated a random 256-bit token, committed its Keccak-256 hash in Block #X, and invisibly watermarked the text."*

5. **Step 5: Copy the Leaked Content**
   - In Alice's portal, show the **Simulate Text Leak** card.
   - Click **Copy Leaked Content to Clipboard** (or open the downloaded file and copy text).
   - Show that visually the text looks like normal, ordinary text.

6. **Step 6: Forensic Attribution (The Wow Factor)**
   - Log back in as **Admin**.
   - Navigate to **Forensic Analysis**.
   - Paste the copied text into the text area.
   - Click **Analyze Leaked Text**.
   - **Show the result:** The engine extracts the zero-width Unicode bits, calculates the Keccak-256 commitment, queries the blockchain, and returns:
     - **Matched Account:** `alice`
     - **Wallet Address:** `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
     - **Document:** `Acquisition M&A Strategy Policy`
     - **Exact Version:** `v1`
     - **Issuance Timestamp & Transaction Hash**

7. **Step 7: Demonstrate Access Revocation & Tamper Detection**
   - Go to **Access Control** and click **Revoke Access** for Alice.
   - Switch to Alice's window: the UI instantly updates to **NO ACCESS** via WebSockets.
   - When Alice attempts to download again, the request is **rejected with HTTP 403 (On-Chain Permission Denied)**.
   - Finally, open **Blockchain Explorer** (`/explorer`) to show Ma'am the chronological blocks, transaction hashes, and gas logs.

---

### High-Yield Viva Q&A Cheat Sheet

#### Q1: "Why did you use blockchain for this instead of a standard SQL database?"
> **Answer:** *"A standard SQL database has a single point of administrative failure: anyone with root or DBA access can update or delete audit records without detection. The blockchain acts as an append-only, decentralized state machine where every document registration, access grant, revocation, and issuance commitment is cryptographically signed and chained with hashes. It guarantees tamper-evidence and non-repudiation."*

#### Q2: "Why don't you store the document content directly on the smart contract?"
> **Answer:** *"Storing document content on the blockchain has two fatal flaws: first, cost—storing 1MB of data on Ethereum would cost hundreds of millions of gas. Second, privacy—all EVM data is public to node operators, which would violate enterprise confidentiality. Instead, we store a 32-byte canonical SHA-256 hash on-chain, while keeping the document content in secure off-chain storage. If the off-chain file is altered by even one character, the hash mismatch is immediately detected."*

#### Q3: "What is the difference between SHA-256 and Ethereum Keccak-256 in your system?"
> **Answer:** *"SHA-256 is used off-chain to compute the deterministic content fingerprint of the document text. Keccak-256 is the native cryptographic hash function of the EVM, used for on-chain issuance commitments (`bytes32 commitment = keccak256(token)`) and role identifiers."*

#### Q4: "Why don't you store the raw issuance token on-chain or in the database?"
> **Answer:** *"That would violate our zero-knowledge commitment scheme. If the raw token were stored on-chain or in the database, a rogue administrator could read the token, paste it into leaked documents, and frame an innocent user. By storing only the one-way Keccak-256 commitment on-chain, the raw token is only revealed when someone produces the actual leaked document text."*

#### Q5: "How does the zero-width watermarking work?"
> **Answer:** *"We generate a 256-bit cryptographically secure random token using Node.js CSPRNG. We convert each bit into an invisible Unicode character: Zero Width Space (`\u200B`) for bit 0, and Zero Width Non-Joiner (`\u200C`) for bit 1. We wrap these 256 bits with a start delimiter (`\uFEFF`) and an end delimiter (`\u2060`), and embed this 258-character invisible sequence at paragraph boundaries. When text is copied, the Unicode buffer carries the invisible characters seamlessly."*

#### Q6: "What are the limitations of zero-width watermarking?"
> **Answer:** *"Zero-width watermarks survive direct copy-pasting across digital applications (Word, browsers, chat apps, emails). However, they do not survive the 'analog hole'—such as photographing a screen or re-typing the document by hand—nor do they survive specialized scripts that strip non-printable Unicode characters."*

#### Q7: "What happens if a user's access is revoked after they downloaded a copy?"
> **Answer:** *"Revocation prevents future downloads immediately because our backend checks current contract state before serving files. However, revocation does not delete previously downloaded copies from the user's hard drive. Instead, the historical issuance commitment remains permanently sealed on the blockchain, so if the user leaks their old copy, we can still trace it back to their wallet and prove the exact timestamp when it was issued."*

---

## 5. System Architecture & Technology Stack

```
+-----------------------------------------------------------------------------+
|                               REACT FRONTEND                                |
|  - Vite + React 18 + TypeScript                                             |
|  - Tailwind CSS Enterprise Dark Cybersecurity Theme                         |
|  - Lucide React Icons + Axios + Socket.IO Client                            |
+--------------------------------------+--------------------------------------+
                                       | HTTP REST & WebSocket Events
                                       v
+-----------------------------------------------------------------------------+
|                          EXPRESS.JS BACKEND API                             |
|  - TypeScript + Node.js (v18 - v24)                                         |
|  - CSPRNG 256-bit Token Generator (`crypto.randomBytes`)                    |
|  - Zero-Width Steganography Encoder & Extraction Engine                     |
|  - Deterministic Text Canonicalization Engine                               |
|  - PDFKit Dynamic Document Watermarking Generator                           |
|  - ethers.js v6 Smart Contract Client & Live Event Listener                 |
+--------------------------------------+--------------------------------------+
                                       | JSON-RPC (localhost:8545)
                                       v
+-----------------------------------------------------------------------------+
|                     SOLIDITY SMART CONTRACT CORE                            |
|  - DataLeakLedger.sol (Solidity ^0.8.24)                                    |
|  - OpenZeppelin AccessControl RBAC                                          |
|  - Hardhat EVM Local Network (Chain ID: 31337)                              |
+-----------------------------------------------------------------------------+
```

---

## 6. Quick Start & Setup Instructions

### Prerequisites
- **Node.js:** v18, v20, v22, or v24
- **npm:** v9+

### Step 1: Install Dependencies
```bash
# Root dependencies (Hardhat, ethers, OpenZeppelin)
npm install

# Backend dependencies (Express, PDFKit, Socket.IO, crypto)
npm --prefix backend install

# Frontend dependencies (React, Vite, Tailwind CSS, Lucide)
npm --prefix frontend install
```

### Step 2: Run Automated Tests
```bash
# Run smart contract unit tests (20 tests)
npm test

# Run backend forensic steganography tests (6 tests)
npm run test:backend
```

### Step 3: Run the Local Blockchain & Servers
Open **3 terminal windows**:

**Terminal 1: Start Local Hardhat EVM Blockchain**
```bash
npm run node
```
*(Starts EVM node at `http://127.0.0.1:8545` with Chain ID `31337`)*

**Terminal 2: Deploy Smart Contract & Start Backend API**
```bash
npm run deploy:local
npm run backend
```
*(Deploys `DataLeakLedger.sol` and starts API at `http://localhost:5001`)*

**Terminal 3: Start Frontend Application**
```bash
npm run frontend
```
*(Opens Vite React application at `http://localhost:5173`)*

---

## 7. Automated Test Suite (26 Passing Tests)

### Smart Contract Test Suite (`test/DataLeakLedger.test.ts` — 20 Tests)
- `✔ should set up admin and issuer roles correctly`
- `✔ should register a new document and emit FileRegistered event`
- `✔ should reject duplicate document registration`
- `✔ should reject zero document ID or zero content hash`
- `✔ should reject document registration from unauthorized accounts`
- `✔ should add a new version and preserve historical version records`
- `✔ should reject adding version to non-existent document`
- `✔ should reject zero content hash for new version`
- `✔ should reject adding version from non-admin account`
- `✔ should grant access and emit AccessGranted event`
- `✔ should revoke access and emit AccessRevoked event`
- `✔ should reject grant or revoke from unauthorized accounts`
- `✔ should reject grant or revoke for non-existent document or zero address`
- `✔ should record issuance commitment for authorized user and emit IssuanceRecorded`
- `✔ should reject duplicate issuance commitments`
- `✔ should reject zero commitment`
- `✔ should reject issuance call from unauthorized non-issuer account`
- `✔ should reject issuance when user has no access`
- `✔ should reject issuance when user's access has been revoked`
- `✔ should reject issuance for nonexistent document or invalid version`

### Backend Forensic Test Suite (`backend/tests/forensics.test.ts` — 6 Tests)
- `✔ should generate cryptographically random 256-bit token and matching Keccak-256 commitment`
- `✔ should correctly encode and decode 256-bit token to and from zero-width Unicode`
- `✔ should detect and report malformed markers and incomplete frames`
- `✔ should survive multi-paragraph text and recover from partial text leak`
- `✔ should produce identical SHA-256 hashes regardless of CRLF or trailing line whitespace`
- `✔ should produce different hash when content is modified (tamper detection)`

---

## 8. License & Academic Integrity

This project is an academic prototype developed for college semester evaluation in Blockchain and Information Security.  
Released under the **MIT License**.
