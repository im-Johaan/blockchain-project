# DataLeak Ledger: Presentation Slide Deck (12 Slides)
*Formatted for direct import into Canva ("Docs to Decks"), PowerPoint, or Marp*

---

## Slide 1: Title Slide
### DataLeak Ledger: Blockchain Audit & Forensic Steganography
- **Subheading:** Solving Privileged Log Tampering & Untraceable Copy-Paste Exfiltration
- **Presenter:** Johaan Sam Sanil
- **Course:** Blockchain Architecture, Smart Contracts & Information Security
- **Core Technology:** Solidity 0.8.24, Hardhat, Ethers.js v6, Node.js CSPRNG, React 18, Tailwind CSS
- **Test Status:** 26 Automated Unit Tests Passing (20 Smart Contract + 6 Forensic Tests)

---

## Slide 2: Problem Statement: The Dual Vulnerability
### 1. Privileged Database Log Tampering (The Rogue Admin)
- In traditional document management systems, audit logs reside in centralized SQL/NoSQL databases.
- A privileged database administrator (DBA) or an attacker with root server access can silently alter (`UPDATE`) or delete (`DELETE`) access records.
- Logs can be backdated arbitrarily, providing zero mathematical proof of external integrity or non-repudiation.

### 2. Untraceable Copy-Paste Exfiltration (The Text Leak Gap)
- Visual watermarks (stamps, headers, diagonal text) disappear completely when text is copied to the clipboard.
- Conventional servers issue identical document copies to all authorized users.
- When leaked confidential text surfaces in an email or public forum, conventional logs show who downloaded the file, but CANNOT prove which specific issued copy was leaked.

---

## Slide 3: System Solution & High-Level Architecture
### Hybrid On-Chain / Off-Chain Design
- **React 18 Frontend:** Cybersecurity dark UI with real-time telemetry, access toggles, and live WebSocket alerts.
- **Express.js Backend API:** Serves as the atomic enforcement gateway; checks live on-chain permissions before streaming files.
- **Solidity Smart Contract (`DataLeakLedger.sol`):** Authoritative single source of truth for document fingerprints, versions, access control, and issuance commitments.
- **Forensic Engine:** Node.js CSPRNG 256-bit token generator and zero-width Unicode steganography encoder/decoder.

---

## Slide 4: Why Blockchain & Smart Contracts?
### The Decentralized Single Source of Truth
- **Tamper-Proof Immutability:** Every EVM block is cryptographically linked via `parentHash`. Altering historical records breaks the cryptographic hash chain.
- **Non-Repudiation:** Transactions are signed with private keys using ECDSA (`secp256k1`). Signers cannot deny their actions.
- **Why Raw Files Stay Off-Chain (Gas & Privacy Economics):**
  - Storing 1 MB on Ethereum costs ~640 million gas ($SSTORE$ opcodes) and exposes confidential corporate data to public node operators.
  - Our solution: We store a 32-byte canonical SHA-256 hash on-chain (~45,000 gas fixed cost) while preserving complete confidentiality in off-chain storage.

---

## Slide 5: Smart Contract Deep-Dive (`DataLeakLedger.sol`)
### Role-Based Access Control & Core Logic
- **`ADMIN_ROLE`:** Manages document registration and access permissions.
- **`ISSUER_ROLE`:** Restricted to the backend signing service for recording issuance commitments.
- **`registerDocument(docId, contentHash)`:** Registers unique document identifier and seals Version 1 hash.
- **`addVersion(docId, newContentHash)`:** Increments version counter and links to `previousHash`.
- **`grantAccess(docId, user)` & `revokeAccess(docId, user)`:** Mutates permission state on-chain.
- **`recordIssuance(commitment, docId, version, user)`:** Records Keccak-256 commitment. Reverts with `AccessDenied` if user has no active permission.
- **Gas Optimization:** Uses Solidity 0.8.24 custom 4-byte error selectors (`error AccessDenied(bytes32, address)`) instead of expensive revert strings.

---

## Slide 6: Deterministic Canonicalization & Version Chaining
### Mathematical Integrity Assurance
- **Deterministic Canonicalization:** Normalizes line endings (`\r\n` and `\r` $\rightarrow$ `\n`), strips trailing whitespace, and enforces UTF-8. Eliminates cross-platform hash discrepancies between Windows, Mac, and Linux.
- **Avalanche Effect:** Altering even one character changes the SHA-256 content hash completely.
- **Immutable Version Tree:**
  - Version 1: `contentHash = SHA256(v1)`, `previousHash = 0x0`
  - Version 2: `contentHash = SHA256(v2)`, `previousHash = SHA256(v1)`
  - Version $N$: Links sequentially back through all historical revisions. Historical records are never overwritten.

---

## Slide 7: Cryptographic Commitment Scheme (Zero-Knowledge Attribution)
### 256-Bit CSPRNG & Keccak-256 Hashing
- **True Entropy Generation:** Fresh 256-bit (32-byte) random token $T$ generated via Node.js `crypto.randomBytes(32)` (CSPRNG, never predictable `Math.random()`).
- **One-Way Commitment:** $C = \text{Keccak-256}(T)$. Only commitment $C$ is submitted to the blockchain.
- **Why Raw Tokens Are Never Stored On-Chain or in DB:**
  - Storing raw tokens would allow rogue admins to steal a user's token and plant it in fake leaks.
  - By storing only $C$, innocent users cannot be framed. Token $T$ exists solely inside the issued document copy.

---

## Slide 8: Zero-Width Unicode Forensic Steganography
### The Invisible Watermark Mechanics
- **`\u200B` (Zero Width Space):** Represents binary bit `0`.
- **`\u200C` (Zero Width Non-Joiner):** Represents binary bit `1`.
- **`\uFEFF` (BOM):** START frame delimiter.
- **`\u2060` (Word Joiner):** END frame delimiter.
- **Frame Structure:** $1\text{ (Start)} + 256\text{ Bits} + 1\text{ (End)} = 258\text{ characters}$ (completely invisible to human eyes).
- **Multi-Paragraph Redundancy:** Marker frames are embedded at the end of EVERY paragraph. If a leaker copies only a single paragraph, the full 256-bit token is still 100% recovered!

---

## Slide 9: Atomic On-Chain Enforcement & Download Pipeline
### 5-Step Verified Delivery Workflow
1. **JWT Authentication:** Authenticates user and resolves Ethereum wallet address.
2. **Live Contract Check:** Backend queries `DataLeakLedger.hasAccess(docId, user)`. If revoked $\rightarrow$ HTTP 403 Forbidden.
3. **Cryptographic Issuance:** Generates 256-bit token $T$ and commitment $C = \text{Keccak-256}(T)$.
4. **Mined Transaction:** Calls `recordIssuance(C, docId, version, user)` and confirms mined receipt (`status == 1`).
5. **Dynamic Watermarking:** Embeds token $T$ invisibly into text/PDF and streams file to client.

---

## Slide 10: Forensic Extraction & Attribution Pipeline
### Catching the Leaker
1. **Delimiter Scanning:** Forensic parser scans pasted text for `\uFEFF` and `\u2060`.
2. **Bit Decoding:** Reconstructs 256 bits (`\u200B` $\rightarrow$ 0, `\u200C` $\rightarrow$ 1) into 32-byte hex token $T$.
3. **Commitment Hashing:** Computes $C = \text{Keccak-256}(T)$.
4. **On-Chain Lookup:** Calls `DataLeakLedger.getIssuance(C)`.
5. **Irrefutable Proof:** Returns exact recipient wallet address (Alice: `0x3C44...93BC`), document title, version issued, block number, and issuance timestamp.

---

## Slide 11: 7-Step Live Demonstration Walkthrough
### Viva Demo Script
1. **Admin Registers Document:** Uploads `sample-policy.md`; SHA-256 hash mined in Block #1.
2. **Admin Grants Access to Alice:** Calls `grantAccess()` on `DataLeakLedger` smart contract.
3. **Alice Downloads File:** On-chain permission verified; commitment mined in Block #2; file watermarked.
4. **Alice Simulates Leak:** Copies a text snippet containing invisible zero-width characters.
5. **Forensic Attribution Match:** Admin pastes text into Forensic Portal $\rightarrow$ **Matched to Alice's wallet address!**
6. **Revoke Access & Denial:** Admin revokes Alice $\rightarrow$ WebSocket updates UI to NO ACCESS $\rightarrow$ Next download blocked with HTTP 403.
7. **Blockchain Explorer:** Inspect blocks, hashes, transaction receipts, and gas logs live on-chain.

---

## Slide 12: Scope, Limitations & Viva Defense
### Academic Honesty & Boundary Clarity
- **What It Mathematically Guarantees:** Proves that the leaked text originated from a specific copy issued to a specific wallet at a verified timestamp.
- **The Analog Hole:** Photographing a computer screen or manually re-typing text on another keyboard bypasses zero-width characters.
- **Regex Normalization:** Scripts explicitly filtering non-printable Unicode can strip the watermark.
- **Consensus Distinction:** Hardhat simulates single-node execution for testing; production consortiums would run QBFT (Quorum Byzantine Fault Tolerance) across independent auditing bodies.
