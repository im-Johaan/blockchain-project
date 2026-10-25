# PROJECT BUILD PROMPT: DataLeak Ledger
## Blockchain Audit & Forensic Steganography Platform

Act as a senior full-stack developer, blockchain engineer, and technical mentor. Build a complete, working, end-to-end college semester project named **DataLeak Ledger: Blockchain Audit & Forensic Steganography**.

I am a data analytics and engineering student taking a blockchain course. I have only **5 days to complete this project**, so prioritize a reliable, runnable implementation over unnecessary complexity. The application must demonstrate genuine blockchain functionality, smart contracts, transaction history, access control, cryptographic verification, and a practical forensic use case.

Do not merely provide an architecture, pseudocode, or isolated examples. Generate a complete project with all necessary source files, configuration, tests, setup instructions, and documentation.

If you have access to a coding workspace, create and test the project files directly. Otherwise, provide the files in a clear, organized, sequential manner, ensuring they work together.

---

# 1. PROJECT OVERVIEW

### Project title
**DataLeak Ledger: Blockchain Audit & Forensic Steganography**

### Problem statement

Traditional document-sharing platforms typically store access logs in conventional databases. A privileged administrator could potentially modify or delete those logs. Additionally, when an authorized user leaks confidential text by copying and pasting it elsewhere, conventional access logs cannot reliably identify which particular issued copy the leaked text originated from.

DataLeak Ledger addresses these issues by combining blockchain-based audit records, smart-contract-enforced access permissions, cryptographic file verification, and invisible text markers for forensic attribution.

### Core objectives

1. Maintain a tamper-evident, blockchain-backed document audit history.
2. Register document hashes without storing document contents on-chain.
3. Maintain document versions instead of overwriting historical records.
4. Grant and revoke document access through Solidity smart contracts.
5. Enforce current on-chain permissions before serving document downloads.
6. Generate individually identifiable document copies using cryptographically random issuance tokens.
7. Embed tokens into generated PDF text using zero-width Unicode characters.
8. Recover markers from leaked text and verify issuance commitments against blockchain records.
9. Demonstrate block history, transactions, contract events, access control, and tamper detection.
10. Provide a clean web interface suitable for a college project demonstration and viva.

### Scope and limitations

This is an academic prototype, not a production-ready secure document management system.

The system should demonstrate integrity verification and recorded issuance attribution. It must not claim that blockchain proves a document is factually authentic, that the original uploader is trustworthy, or that a particular person personally leaked a file.

A recovered marker identifies a recorded issuance associated with a user account. It does not independently prove who physically copied or distributed the text.

The application must not claim protection against screenshots, photographing screens, manually retyping content, or other methods that remove the embedded marker.

---

# 2. REQUIRED TECHNOLOGY STACK

Use the following technologies unless a specific compatibility issue requires a documented alternative.

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- ethers.js
- Axios or Fetch API
- WebSockets using Socket.IO client, if time permits

### Backend
- Node.js
- TypeScript
- Express.js
- ethers.js
- PDFKit for PDF generation
- `crypto` module for cryptographic randomness and hashing
- Socket.IO for real-time updates
- Zod for request validation

### Blockchain
- Solidity
- Hardhat
- A locally deployed Hardhat Ethereum development network
- ethers.js for smart-contract interaction
- OpenZeppelin contracts where appropriate, particularly access control
- Mocha and Chai or the testing framework supported by the chosen Hardhat version

### Storage
- PostgreSQL for document metadata, user records, and query-friendly UI data if time permits
- Local filesystem for uploaded documents
- JSON-based local persistence may be used for noncritical metadata during the initial implementation if PostgreSQL setup threatens the deadline

### Cryptography
- SHA-256 for canonical document-content fingerprints
- Ethereum Keccak-256 for issuance-token commitments
- Cryptographically secure random issuance tokens generated with Node.js `crypto`
- Zero-width Unicode characters for text watermarking

### Compatibility requirement

Before generating configuration, choose a mutually compatible set of Node.js, Hardhat, Solidity, ethers.js, and OpenZeppelin versions.

Prefer Hardhat 2 with ethers.js 6 if that provides the simplest compatible setup. Do not mix Hardhat 2 and Hardhat 3 configuration conventions or APIs.

Use TypeScript consistently in the frontend and backend, and Solidity for the smart contract.

---

# 3. ARCHITECTURE

Implement this architecture:

React frontend
    |
    v
Node.js + Express API
    |
    +---- Authentication and authorization
    |
    +---- Document upload and version management
    |
    +---- On-chain permission verification
    |
    +---- PDF generation and invisible watermarking
    |
    +---- Forensic token extraction and verification
    |
    +---- Blockchain event listener
    |
    +---- PostgreSQL or local metadata persistence
    |
    v
Solidity smart contract
    |
    v
Hardhat local Ethereum development network

### Source-of-truth rules

- The smart contract is authoritative for document registration state, version references, access permissions, and issuance commitments.
- The blockchain is authoritative for accepted on-chain transaction history and contract events.
- The backend must not rely exclusively on PostgreSQL to decide whether a user currently has permission to download a document.
- PostgreSQL is an off-chain indexing and application-storage layer.
- Uploaded documents and confidential source text remain off-chain.
- Raw issuance tokens must never be stored in PostgreSQL or emitted in blockchain events.
- The application must not expose confidential document contents in public blockchain transactions.

For this five-day prototype, the backend can manage files in local storage. Make the storage layer modular so that it can later be replaced with object storage.

---

# 4. SMART CONTRACT REQUIREMENTS

Create a Solidity contract named `DataLeakLedger.sol`.

The contract should implement the following features.

## 4.1 Roles

Use an administrator role to manage documents and permissions.

Requirements:
- Only authorized administrators can register documents.
- Only authorized administrators can add document versions.
- Only authorized administrators can grant or revoke access.
- Issuance records can only be submitted by the trusted backend issuer or an explicitly authorized issuer account.
- Unauthorized calls must revert.
- Include tests for all important authorization failures.

Use OpenZeppelin `AccessControl` if compatible with the chosen configuration.

For the local demo, explain that the trusted backend issuer account is part of the prototype's trust model.

## 4.2 Document registration

Implement a function equivalent to:

`registerDocument(bytes32 documentId, bytes32 contentHash)`

The function must:
- Reject duplicate document IDs.
- Reject invalid zero-value identifiers or hashes where appropriate.
- Record the document's administrator and registration timestamp.
- Create the first document version.
- Emit a `FileRegistered` event.

## 4.3 Document versioning

Implement a function equivalent to:

`addVersion(bytes32 documentId, bytes32 newContentHash)`

The function must:
- Require an existing document.
- Require an authorized administrator.
- Preserve historical versions.
- Record the new version's content hash, previous version reference, and timestamp.
- Increment the version number.
- Emit a `VersionAdded` event.

Never overwrite historical document versions.

Each issuance must reference the exact document version issued.

## 4.4 Access permissions

Implement:

- `grantAccess(bytes32 documentId, address user)`
- `revokeAccess(bytes32 documentId, address user)`
- `hasAccess(bytes32 documentId, address user)`

Requirements:
- Permissions must be scoped to individual documents.
- Unauthorized permission changes must revert.
- Granting and revoking access must emit events.
- The backend must check the current contract permission before every new download.
- Revocation must prevent subsequent downloads.
- Revocation cannot retroactively erase copies already downloaded.

Use events named:
- `AccessGranted`
- `AccessRevoked`

Avoid treating an old `AccessGranted` event as proof of current permission. Always check the current contract state.

## 4.5 Issuance registry

Implement a function equivalent to:

`recordIssuance(bytes32 issuanceCommitment, bytes32 documentId, uint256 version, address user)`

Requirements:
- Only the authorized issuer can call this function.
- The referenced document and version must exist.
- The issuance commitment must be nonzero and unique.
- The user must have current access when the issuance is recorded.
- Store the commitment, document identifier, version number, user address, and issuance timestamp.
- Emit an `IssuanceRecorded` event.

Do not store the raw issuance token.

A leaked token should be verifiable by hashing it and matching its commitment against the contract's records.

The backend must not return a successful download until the issuance transaction has been mined successfully and the receipt has been checked.

## 4.6 Audit events

Implement suitable events for:
- Document registration
- Version addition
- Access grants
- Access revocation
- Issuance recording

Include enough information for the backend to reconstruct audit history without publishing document contents, confidential text, or raw issuance tokens.

Use privacy-conscious identifiers. Avoid storing personal names, email addresses, document titles, or confidential metadata directly on-chain.

## 4.7 Smart-contract tests

Write automated tests for:
- Document registration
- Duplicate registration rejection
- Version creation and historical preservation
- Permission granting
- Permission revocation
- Unauthorized access changes
- Issuance commitment uniqueness
- Issuance rejection for invalid document versions
- Issuance rejection when access has been revoked
- Correct event emission
- Contract state after successful and failed operations

Make sure all tests pass.

---

# 5. BLOCKCHAIN IMPLEMENTATION AND CONSENSUS EXPLANATION

We have selected **Option A1: Hardhat local blockchain with Solidity smart contracts**.

The project must use a real EVM-compatible local blockchain and submit actual transactions to the deployed smart contract.

Demonstrate:
- Contract deployment
- Transaction submission
- Transaction hashes
- Block numbers
- Transaction receipts
- Contract events
- Block history
- Smart-contract state changes
- Tamper-evident audit history

### Critical accuracy requirement

Do not falsely claim that a single Hardhat local development node implements decentralized consensus among independent validators.

Hardhat abstracts away the distributed consensus mechanism for development and testing. Its local network allows us to demonstrate smart-contract execution and blockchain transaction behavior, but not multi-validator consensus.

Include a section in the documentation called `Consensus Mechanism and Limitations` that explains:

1. What blockchain consensus means.
2. How Ethereum networks use consensus to agree on canonical blocks.
3. Why the local Hardhat network does not demonstrate independent-validator consensus.
4. How the local network processes transactions and produces blocks for development.
5. How a future multi-validator Proof of Authority or QBFT network could extend the project.

If practical, implement a small educational consensus simulation as a separate optional module, clearly labelled as a simulation. Do not integrate it into the main permission system or present it as the consensus mechanism of Hardhat.

The main project must remain runnable without this optional simulation.

---

# 6. DOCUMENT UPLOAD AND VERSION MANAGEMENT

Implement document upload for plain-text and Markdown files first.

Supported initial formats:
- `.txt`
- `.md`

Optional extension:
- PDF upload, only if it can be implemented safely without delaying core features.

### Upload flow

1. Admin uploads a document.
2. Backend validates file type and size.
3. Backend reads the source text.
4. Backend applies a documented canonicalization process.
5. Backend computes SHA-256 of the canonical content.
6. Backend stores the file off-chain.
7. Backend submits the document registration transaction.
8. Backend waits for the successful transaction receipt.
9. Backend stores an off-chain metadata record.
10. Frontend displays the document ID, version, transaction hash, and block number.

The canonicalization process must be deterministic. Document it clearly and use the same process during verification.

Do not hash a different representation during verification than the one used during registration.

### Editing a document

When an administrator edits a document:
- Create a new version.
- Compute its new content hash.
- Submit the new version on-chain.
- Preserve the previous source file and its hash.
- Show the complete version history.
- Ensure new downloads use the latest authorized version.
- Ensure historical issuances continue to reference their original versions.

Do not overwrite files referenced by earlier issuances.

---

# 7. FORENSIC STEGANOGRAPHY

This is the distinctive feature of DataLeak Ledger.

Implement a watermarking system that embeds an issuance token into the extracted text of a generated PDF using zero-width Unicode characters.

## 7.1 Token generation

Generate a fresh, cryptographically random 256-bit issuance token for every document download.

Use Node.js `crypto` to generate the token.

Do not use `Math.random()`.

Compute the commitment using Ethereum Keccak-256 through ethers.js.

Ensure the hashing method is exactly consistent between issuance creation and forensic verification. Do not accidentally use standardized SHA3-256 where Ethereum Keccak-256 is required.

## 7.2 Token encoding

Implement a clearly documented encoding scheme.

Suggested design:
- Generate a random 256-bit token.
- Convert the token into a fixed-length binary representation.
- Map binary bits to two invisible Unicode characters, such as ZERO WIDTH SPACE and ZERO WIDTH NON-JOINER.
- Wrap the marker with distinguishable start and end framing characters.
- Repeat framed markers at sensible text boundaries, such as paragraph boundaries, to improve the chance of recovery from partial text leaks.

Do not rely on a marker being repeated every 40 words as a guarantee of survival. Treat repetition as a best-effort resilience feature.

Write encoding and decoding unit tests, including malformed markers and incomplete frames.

## 7.3 PDF generation

Use PDFKit.

Requirements:
- Generate PDFs dynamically from the selected document version.
- Embed the issuance marker in the generated text.
- Use a suitable Unicode-capable font when necessary.
- Preserve readable document text.
- Avoid placing raw tokens or secrets in PDF metadata.
- Ensure the token is not visibly rendered as ordinary characters.
- Validate that the actual generated PDF preserves the zero-width characters in its extractable text representation.

Do not assume that PDFKit preserves zero-width Unicode characters correctly. Test the output with a PDF text extraction library or another repeatable extraction mechanism.

If zero-width characters do not survive PDF generation and extraction reliably, provide a documented fallback for the five-day demo, such as watermarking a downloadable plain-text representation. Do not silently claim the PDF watermark works when it does not.

## 7.4 Leak attribution

Create a forensic endpoint and UI where an administrator can paste leaked text.

The backend must:
1. Parse framed zero-width markers.
2. Decode valid issuance tokens.
3. Compute each token's commitment.
4. Search for matching commitments in the blockchain registry.
5. Verify the associated document version and user address.
6. Return the matching issuance transaction hash, block number, and timestamp.
7. Report no match for invalid, unknown, or malformed tokens.

The forensic endpoint must not accept arbitrary user-supplied identities as evidence of attribution.

A matching token is evidence that the leaked text contains a marker associated with a recorded issuance. Explain the trust assumptions and possibility of marker copying or deliberate manipulation.

The raw token must never be logged or persisted in plaintext.

---

# 8. BACKEND API

Build a modular Express backend with routes such as:

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Implement simple authentication suitable for an academic prototype, with hashed passwords and secure session handling or appropriately configured JWTs.

Do not hardcode plaintext passwords or production secrets.

Clearly explain that demo credentials and local keys are for development only.

### Documents
- `POST /api/documents`
- `GET /api/documents`
- `GET /api/documents/:id`
- `POST /api/documents/:id/versions`
- `GET /api/documents/:id/versions`

### Permissions
- `POST /api/documents/:id/access`
- `DELETE /api/documents/:id/access/:userId`
- `GET /api/documents/:id/access`

### Downloads
- `POST /api/documents/:id/download`
- `GET /api/documents/:id/download`

The download path must:
- Authenticate the user.
- Resolve the exact version.
- Check current on-chain access.
- Generate a fresh issuance token.
- Submit the issuance commitment on-chain.
- Verify the transaction receipt.
- Generate the marked document.
- Return the document only after successful issuance recording.

Avoid generating or returning an authorized document if the permission check or blockchain transaction fails.

Use safe file names, path validation, size limits, and upload validation.

### Forensics
- `POST /api/forensics/verify`

Accept leaked text and return the matching issuance details if a valid marker is found.

Do not disclose unrelated user records or raw issuance tokens.

### Blockchain explorer
- `GET /api/blockchain/status`
- `GET /api/blockchain/blocks`
- `GET /api/blockchain/transactions`
- `GET /api/blockchain/audit/:documentId`

Return real blockchain information, including transaction hashes, block numbers, and relevant contract events.

Implement pagination or sensible result limits.

---

# 9. EVENT INDEXING AND WEBSOCKETS

Implement a basic blockchain event listener.

Listen for:
- `FileRegistered`
- `VersionAdded`
- `AccessGranted`
- `AccessRevoked`
- `IssuanceRecorded`

When a permission is revoked:
- Update any derived off-chain permission cache.
- Emit a Socket.IO event such as `access-revoked`.
- Update the user's UI.
- Require a fresh on-chain permission check for future downloads.

The application must not depend on WebSockets for security. They are only for real-time notification.

If the backend restarts, it should be able to rebuild or reconcile its derived event index by querying the contract event history.

For the five-day MVP, this can be a straightforward event listener with a reconciliation script rather than a sophisticated indexing service.

---

# 10. FRONTEND REQUIREMENTS

Build a clean, professional, responsive application using React, TypeScript, and Tailwind CSS.

The visual design should resemble a modern enterprise cybersecurity application:
- Dark navy or charcoal background.
- Restrained blue accents.
- Clear status indicators.
- Readable typography.
- Responsive tables.
- Consistent spacing.
- Loading states, empty states, and useful error messages.

Avoid excessive animations and decorative elements that do not improve usability.

Create the following pages.

## 10.1 Login
- Login form.
- Role-aware navigation.
- Authentication error handling.

## 10.2 Admin dashboard
Display:
- Total registered documents.
- Total document versions.
- Active access grants.
- Total recorded issuances.
- Recent blockchain activity.

All displayed blockchain counts must come from real contract queries or indexed contract events, not hardcoded demonstration values.

## 10.3 Document manager
- Upload a document.
- List registered documents.
- Show current version and hash.
- Add a new version.
- View version history.
- View registration transaction details.

## 10.4 Access management
- Select a document.
- Grant access to a user.
- Revoke access.
- Display current permission status.
- Show corresponding transaction hashes and events.

## 10.5 User document portal
- Show documents available to the authenticated user.
- Request downloads.
- Display the exact version being downloaded.
- Display the issuance transaction status.
- Download the generated watermarked PDF.

## 10.6 Blockchain explorer
Show:
- Block number.
- Block hash.
- Parent/previous block hash.
- Transaction count.
- Transaction hash.
- Sender and recipient where applicable.
- Contract event name.
- Timestamp.
- Document identifier or pseudonymous reference where appropriate.

Do not display sensitive source content or raw issuance tokens.

Make it possible to click a transaction and view its receipt and related contract event.

## 10.7 Forensic portal
- Large text area for pasted leaked content.
- Verify button.
- Match or no-match result.
- Matched document and version.
- Associated user account or wallet address.
- Issuance timestamp.
- Transaction hash and block number.
- Clear explanation of what the result proves and what it does not prove.

## 10.8 Activity and audit page
Display an ordered event timeline showing:
- Document registration.
- Version creation.
- Permission grants and revocations.
- Issuance records.
- Verification attempts, if persisted off-chain.

Clearly distinguish blockchain-backed events from off-chain verification-attempt logs.

---

# 11. DATABASE REQUIREMENTS

Use PostgreSQL if practical.

Suggested tables:
- `users`
- `documents`
- `document_versions`
- `access_index`
- `audit_index`
- `verification_attempts`

The database must not become the authoritative source for blockchain-backed permissions.

Do not store:
- Raw issuance tokens.
- Private keys.
- Plaintext passwords.
- Confidential document contents in public blockchain records.

It is acceptable for the local prototype to store document content in a private local filesystem and metadata in PostgreSQL.

If PostgreSQL would delay the five-day implementation, provide a functional JSON metadata adapter for the MVP, with a clean interface that permits a later PostgreSQL adapter.

---

# 12. SECURITY REQUIREMENTS

Implement and document the following protections:

1. Validate and sanitize API inputs.
2. Restrict file extensions and upload size.
3. Prevent path traversal.
4. Enforce role-based authorization.
5. Check current on-chain access before each download.
6. Record issuance commitments before serving files.
7. Reject duplicate issuance commitments.
8. Never persist raw issuance tokens.
9. Never expose private keys or secrets to the frontend.
10. Keep uploaded documents out of public web directories.
11. Use environment variables for RPC URLs, private keys, database credentials, and JWT secrets.
12. Avoid logging passwords, tokens, or document contents.
13. Explain that a local development private key is not suitable for production.
14. Explain that blockchain immutability does not make a compromised backend trustworthy.
15. Explain that the authorized issuer and source-file storage remain part of the trust model.

Use an appropriate local-only issuer account for the demo. Do not expose a privileged signing key through a frontend environment variable.

---

# 13. PROJECT DIRECTORY STRUCTURE

Create a well-organized monorepo similar to:

dataleak-ledger/
├── contracts/
│   └── DataLeakLedger.sol
├── scripts/
│   └── deploy.ts
├── test/
│   └── DataLeakLedger.test.ts
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── blockchain/
│   │   ├── forensics/
│   │   ├── watermark/
│   │   ├── storage/
│   │   └── database/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
├── shared/
│   └── types/
├── docs/
│   ├── architecture.md
│   ├── consensus.md
│   ├── security.md
│   └── viva-questions.md
├── uploads/
├── .env.example
├── .gitignore
├── package.json
├── hardhat.config.ts
├── tsconfig.json
├── README.md
└── docker-compose.yml

Adapt this structure as needed, but keep the contract, backend, frontend, and tests clearly separated.

Do not commit uploaded documents, secrets, real private keys, or runtime-generated database files.

---

# 14. REQUIRED DEMONSTRATION SCENARIO

The finished project must support the following end-to-end demonstration.

### Step 1: Register a document
The admin uploads `ConfidentialPolicy.md`.

Expected result:
- File stored off-chain.
- SHA-256 content hash calculated.
- Document registration transaction mined.
- Document appears in the admin dashboard.
- Blockchain explorer displays its transaction and block.

### Step 2: Grant access
The admin grants access to a demo user.

Expected result:
- Permission transaction mined.
- `AccessGranted` event recorded.
- User sees the document in their portal.

### Step 3: Download a watermarked copy
The user downloads the document.

Expected result:
- Current on-chain permission is checked.
- Unique issuance token generated.
- Commitment recorded on-chain.
- Receipt verified.
- PDF generated with invisible text markers.
- Download includes the exact version identifier.

### Step 4: Simulate a text leak
Copy a paragraph from the generated PDF, including its extracted zero-width characters, and paste it into the forensic portal.

Expected result:
- Marker extracted.
- Commitment matched against the blockchain.
- Issuance details returned.
- UI displays the associated user, document version, issuance transaction, and timestamp.

If the PDF library does not preserve the invisible marker, demonstrate the same workflow with the documented plain-text fallback. Do not fake a successful PDF extraction.

### Step 5: Revoke access
The admin revokes the user's access.

Expected result:
- Revocation transaction mined.
- `AccessRevoked` event recorded.
- WebSocket notification sent.
- The next download attempt fails due to the current on-chain permission state.

### Step 6: Edit the document
The admin updates the policy and creates version 2.

Expected result:
- Version 1 remains preserved.
- Version 2 has a new content hash and a reference to the previous version.
- New downloads use version 2.
- Historical issuance records continue to identify the version originally downloaded.

### Step 7: Demonstrate tamper detection
Modify a copy of the original source document and compare its hash with the registered hash.

Expected result:
- The mismatch is detected.
- Historical blockchain records remain unchanged.

Also demonstrate that changing a local representation of historical blockchain data is not equivalent to modifying the canonical chain. Explain the limitations of a single local node.

---

# 15. AUTOMATED TESTS

Create automated tests for:
- Smart-contract authorization.
- Registration and versioning.
- Grant and revoke operations.
- Issuance commitments.
- File hash verification.
- Canonicalization consistency.
- Token encoding and decoding.
- Malformed and incomplete watermark markers.
- Unknown issuance tokens.
- Download rejection after revocation.
- Historical version integrity.
- Event indexing and reconstruction.
- Authentication and authorization middleware.

Prioritize meaningful tests for the core blockchain and forensic flows over superficial test coverage.

Provide commands to run each test suite.

---

# 16. DOCUMENTATION AND VIVA PREPARATION

Generate a detailed README covering:
- Project overview.
- Problem statement.
- Objectives.
- Architecture.
- Technology stack.
- Prerequisites.
- Installation.
- Environment variables.
- Smart-contract deployment.
- Backend setup.
- Frontend setup.
- Test execution.
- Demo workflow.
- API reference.
- Troubleshooting.
- Security limitations.

Also create:
- `docs/architecture.md`: architecture and data flow.
- `docs/consensus.md`: blockchain consensus and Hardhat's limitations.
- `docs/security.md`: threat model and trust assumptions.
- `docs/viva-questions.md`: at least 25 viva questions with concise answers.

Include explanations of:
- What a blockchain is.
- Blocks, transactions, hashes, and previous-block hashes.
- Smart contracts and EVM execution.
- Blockchain consensus versus smart-contract authorization.
- Why Hardhat is suitable for local development.
- SHA-256 versus Ethereum Keccak-256.
- Why files remain off-chain.
- Why document versions should be immutable.
- How the issuance commitment works.
- How forensic attribution works.
- How access revocation works.
- Limitations of zero-width Unicode watermarking.
- Why blockchain does not guarantee source authenticity.
- Why a single local node does not demonstrate decentralized consensus.

---

# 17. FIVE-DAY EXECUTION PRIORITIES

Work incrementally.

### Day 1: Blockchain foundation
- Set up Hardhat.
- Implement and test the Solidity contract.
- Deploy to the local network.
- Complete registration, versioning, permissions, and issuance recording.
- Verify actual transactions and events.

### Day 2: Backend
- Build Express API.
- Implement file upload and hashing.
- Implement document storage and version management.
- Connect to the contract.
- Enforce current on-chain permissions.
- Record issuance before returning files.

### Day 3: Forensics
- Implement token generation and commitment.
- Implement marker encoding and decoding.
- Generate PDFs.
- Verify that zero-width characters survive PDF extraction.
- Complete leak-attribution endpoint.

### Day 4: Frontend
- Build admin dashboard.
- Build document and access management pages.
- Build the user download portal.
- Build the forensic portal.
- Add blockchain explorer and basic real-time events.

### Day 5: Stabilization
- Run all tests.
- Fix integration issues.
- Validate the complete demo.
- Complete documentation.
- Prepare screenshots and viva answers.

If time runs out, use this priority order:

1. Working smart contract and local blockchain.
2. Document registration, versioning, and access control.
3. Issuance commitments and verification.
4. Functional leak-attribution demonstration.
5. Basic but polished frontend.
6. PostgreSQL, WebSockets, and optional extras.

Never sacrifice the core blockchain and forensic functionality merely to add more frontend features.

---

# 18. IMPLEMENTATION RULES

Follow these rules throughout development:

1. Do not generate only pseudocode or high-level instructions.
2. Produce complete, mutually compatible source files.
3. Do not leave core functionality as TODO comments.
4. Do not invent successful test results.
5. Run builds and tests if a coding environment is available.
6. Fix errors discovered during testing.
7. If a tool, dependency, or feature is unavailable, explain the limitation and provide a working alternative.
8. Do not silently omit features from the requirements.
9. Use real contract interactions instead of simulated blockchain data in the main application.
10. Keep the implementation small enough to complete within five days.
11. Avoid unnecessary microservices, cloud infrastructure, and external paid services.
12. Do not add cryptocurrency, token economics, or an unrelated NFT feature.
13. Make all critical operations reproducible using documented commands.
14. Use `.env.example` and safe development defaults.
15. Provide a clear distinction between implemented features, optional features, and known limitations.

### Start now

Begin by:
1. Choosing compatible dependency versions.
2. Creating the project structure.
3. Implementing `DataLeakLedger.sol`.
4. Writing and running smart-contract tests.
5. Deploying the contract to a local Hardhat network.
6. Continuing through the backend, forensic logic, frontend, and documentation.

Build the actual working project in small, verifiable stages. At each stage, explain which files were created, which commands to run, and how to verify that the functionality works.

The final result should be a functional, demonstrable, well-documented college blockchain project that can be completed within the five-day deadline.