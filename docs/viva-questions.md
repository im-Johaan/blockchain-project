# College Viva Examination Questions & Concise Answers

### Q1: What is the core problem that DataLeak Ledger solves?
**Answer:** Traditional document systems rely on centralized databases where privileged administrators can tamper with access logs. Furthermore, when an authorized user leaks confidential text by copy-pasting, conventional logs cannot prove which specific issued copy was leaked. DataLeak Ledger combines blockchain-backed immutable audit trails with invisible zero-width forensic watermarks to guarantee tamper detection and leak attribution.

### Q2: What is a blockchain and why is it tamper-evident?
**Answer:** A blockchain is an append-only, distributed cryptographic ledger structured as a sequential chain of blocks. Each block contains the cryptographic hash of its predecessor (`parentHash`). Modifying any historical transaction alters that block's hash, which breaks all subsequent hashes in the chain, immediately exposing the tampering.

### Q3: Why is confidential document text kept off-chain rather than on-chain?
**Answer:** Storing large documents on public or shared blockchains is prohibitively expensive in terms of gas and network bandwidth. More importantly, blockchains are publicly inspectable by all node operators; storing confidential documents on-chain would violate enterprise privacy and regulatory compliance (e.g., GDPR).

### Q4: What does the smart contract actually store for a document?
**Answer:** It stores only the unique document ID (`bytes32`), the canonical SHA-256 content fingerprint (`bytes32`), the administrator wallet address, version metadata, access permission flags, and issuance commitments (`bytes32`).

### Q5: What is the difference between SHA-256 and Ethereum Keccak-256?
**Answer:** SHA-256 is part of the SHA-2 family based on the Merkle-Damgård construction and is used off-chain for canonical document content hashing. Keccak-256 is based on the sponge construction and is the native cryptographic hash function of the Ethereum Virtual Machine (EVM), used here for on-chain issuance commitments and role identifiers.

### Q6: What is deterministic text canonicalization and why is it necessary?
**Answer:** Different operating systems use different newline characters (CRLF on Windows vs. LF on Linux/macOS) and line-end trailing whitespace. Canonicalization normalizes newlines, trims trailing whitespace, and enforces standard UTF-8 encoding before hashing so that the identical text always yields the identical SHA-256 digest regardless of platform.

### Q7: How does the zero-width forensic steganography work?
**Answer:** A cryptographically random 256-bit token is generated using Node.js CSPRNG. The 256 bits are mapped into invisible Unicode characters (`\u200B` for bit 0, `\u200C` for bit 1), enclosed in framing delimiters (`\uFEFF` start and `\u2060` end), and embedded invisibly into document text. The characters are invisible to human readers but remain in the text buffer when copied.

### Q8: What is an issuance commitment?
**Answer:** The commitment is the Ethereum Keccak-256 hash of the 256-bit random issuance token: $\text{Commitment} = \text{Keccak-256}(\text{Token})$. The raw token is embedded in the downloaded document, while only the commitment is submitted to and recorded by the smart contract.

### Q9: Why is the raw issuance token never stored on the blockchain or in the database?
**Answer:** If the raw token were stored on-chain or in the database, any observer or rogue database admin could read the token and generate forged leaked copies attributed to innocent users. By storing only the one-way hash commitment, the system preserves zero-knowledge attribution.

### Q10: How does forensic leak attribution work step-by-step?
**Answer:** An investigator pastes suspect leaked text into the forensic portal. The parser extracts the zero-width Unicode frame, decodes the 256-bit token, computes its Keccak-256 commitment, and queries the smart contract's `getIssuance(commitment)` function. If matched, the contract returns the associated document ID, version, recipient wallet address, and timestamp.

### Q11: What does a successful forensic match prove and what does it NOT prove?
**Answer:** It proves that the text contains a marker whose commitment was officially recorded on-chain when a specific document copy was downloaded by an authorized wallet. It does **not** prove who physically leaked the document, nor does it prove that the recipient's machine or credentials were not compromised.

### Q12: What are the known limitations of zero-width Unicode watermarking?
**Answer:** The marker does not survive optical screen photography, manual retyping, or text normalizers/regex filters that explicitly strip non-printable Unicode characters (`[\u200B-\u200D\uFEFF\u2060]`).

### Q13: How does document versioning work on the smart contract?
**Answer:** Calling `addVersion(documentId, newContentHash)` increments `currentVersion` and creates an immutable `DocumentVersion` struct containing the new hash and the `previousHash`. Historical versions are never overwritten, maintaining an immutable on-chain audit tree.

### Q14: How is access revocation enforced?
**Answer:** When an admin calls `revokeAccess(documentId, user)`, the contract sets `_accessPermissions[documentId][user] = false` and emits `AccessRevoked`. Before serving any subsequent download, the backend queries the contract's `hasAccess` function directly. If revoked, the download is denied.

### Q15: Can revoking access erase copies that a user previously downloaded?
**Answer:** No. Revocation prevents future downloads. However, previously downloaded copies retain their original historical issuance commitments, allowing forensic investigators to identify historical leaks even after access has been revoked.

### Q16: Why doesn't the backend rely exclusively on an off-chain database (e.g. PostgreSQL) for permission checks?
**Answer:** An off-chain database can be modified or manipulated by a privileged database administrator. Relying on the smart contract as the authoritative state machine ensures that permission checks adhere to the immutable on-chain state.

### Q17: What role-based access control (RBAC) model is implemented in DataLeakLedger.sol?
**Answer:** The contract extends OpenZeppelin's `AccessControl` contract, maintaining `DEFAULT_ADMIN_ROLE`, `ADMIN_ROLE` (for registering documents, adding versions, and managing permissions), and `ISSUER_ROLE` (restricted to the trusted backend issuer for recording issuance commitments).

### Q18: What consensus mechanism does the local Hardhat network use?
**Answer:** Hardhat does not use a distributed multi-validator consensus protocol; it runs a single local EVM node that automatically mines transactions as they are submitted. It is designed for development and smart contract testing.

### Q19: How would this system be deployed in an enterprise consortium?
**Answer:** In an enterprise environment, the smart contract would be deployed to a private consortium blockchain running QBFT (Quorum Byzantine Fault Tolerance) or Proof-of-Authority (PoA), where independent entities (auditors, regulators, legal counsel) operate distinct validator nodes.

### Q20: What happens if an admin attempts to register a duplicate document ID?
**Answer:** The contract checks `_documents[documentId].exists` and reverts with the custom error `DocumentAlreadyExists(documentId)`.

### Q21: What happens if an issuer attempts to record a duplicate issuance commitment?
**Answer:** The contract checks `_issuances[commitment].exists` and reverts with the custom error `CommitmentAlreadyExists(commitment)`.

### Q22: What happens if an issuance transaction fails or reverts?
**Answer:** The backend awaits the transaction receipt and verifies `receipt.status === 1`. If the transaction reverts (for example, if access was revoked), the backend halts and does not serve the document.

### Q23: Why do we use custom errors instead of `require(..., "string")` in Solidity 0.8.24?
**Answer:** Custom errors (`error DocumentNotFound(...)`) are substantially more gas-efficient than revert strings because they are encoded as 4-byte error selectors rather than storing dynamic string literals in contract bytecode.

### Q24: What is the purpose of Socket.IO in DataLeak Ledger?
**Answer:** Socket.IO provides real-time client notifications (e.g., notifying the user portal instantly when an admin revokes document access) without requiring manual browser polling. It is an auxiliary UX component; security relies on smart contract validation.

### Q25: How does the system demonstrate tamper detection?
**Answer:** If an attacker modifies the off-chain file content on the server, re-computing its canonical SHA-256 fingerprint will produce a completely different hash that does not match the immutable `contentHash` registered on the smart contract in the blockchain.
