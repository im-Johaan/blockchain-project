// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DataLeakLedger
 * @notice Blockchain-backed document audit and forensic issuance ledger.
 * @dev Maintains tamper-evident document registration, immutable versioning,
 *      on-chain access permissions, and forensic issuance commitments.
 */
contract DataLeakLedger is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct DocumentVersion {
        bytes32 contentHash;
        bytes32 previousHash;
        uint256 timestamp;
    }

    struct DocumentRecord {
        bytes32 documentId;
        address admin;
        uint256 createdAt;
        uint256 currentVersion;
        bool exists;
    }

    struct IssuanceRecord {
        bytes32 commitment;
        bytes32 documentId;
        uint256 version;
        address user;
        uint256 timestamp;
        bool exists;
    }

    // documentId => DocumentRecord
    mapping(bytes32 => DocumentRecord) private _documents;

    // documentId => versionNumber => DocumentVersion
    mapping(bytes32 => mapping(uint256 => DocumentVersion)) private _versions;

    // documentId => userAddress => hasAccess
    mapping(bytes32 => mapping(address => bool)) private _accessPermissions;

    // issuanceCommitment => IssuanceRecord
    mapping(bytes32 => IssuanceRecord) private _issuances;

    // Track all registered document IDs for auditing/indexing
    bytes32[] private _documentIds;

    // Track all recorded issuance commitments
    bytes32[] private _issuanceCommitments;

    // Events
    event FileRegistered(
        bytes32 indexed documentId,
        bytes32 contentHash,
        address indexed admin,
        uint256 timestamp
    );

    event VersionAdded(
        bytes32 indexed documentId,
        uint256 indexed version,
        bytes32 contentHash,
        bytes32 previousHash,
        address indexed admin,
        uint256 timestamp
    );

    event AccessGranted(
        bytes32 indexed documentId,
        address indexed user,
        address indexed admin,
        uint256 timestamp
    );

    event AccessRevoked(
        bytes32 indexed documentId,
        address indexed user,
        address indexed admin,
        uint256 timestamp
    );

    event IssuanceRecorded(
        bytes32 indexed issuanceCommitment,
        bytes32 indexed documentId,
        uint256 version,
        address indexed user,
        uint256 timestamp
    );

    // Custom errors
    error InvalidIdentifier();
    error InvalidContentHash();
    error InvalidUserAddress();
    error InvalidCommitment();
    error DocumentAlreadyExists(bytes32 documentId);
    error DocumentNotFound(bytes32 documentId);
    error VersionNotFound(bytes32 documentId, uint256 version);
    error CommitmentAlreadyExists(bytes32 commitment);
    error AccessDenied(bytes32 documentId, address user);

    constructor(address initialAdmin, address initialIssuer) {
        address admin = initialAdmin == address(0) ? msg.sender : initialAdmin;
        address issuer = initialIssuer == address(0) ? msg.sender : initialIssuer;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, issuer);
    }

    /**
     * @notice Registers a new document and establishes version 1.
     * @param documentId Unique identifier of the document (e.g. SHA-256 of canonical metadata/UUID).
     * @param contentHash SHA-256 hash of canonical document content.
     */
    function registerDocument(
        bytes32 documentId,
        bytes32 contentHash
    ) external onlyRole(ADMIN_ROLE) {
        if (documentId == bytes32(0)) revert InvalidIdentifier();
        if (contentHash == bytes32(0)) revert InvalidContentHash();
        if (_documents[documentId].exists) revert DocumentAlreadyExists(documentId);

        DocumentRecord storage doc = _documents[documentId];
        doc.documentId = documentId;
        doc.admin = msg.sender;
        doc.createdAt = block.timestamp;
        doc.currentVersion = 1;
        doc.exists = true;

        _versions[documentId][1] = DocumentVersion({
            contentHash: contentHash,
            previousHash: bytes32(0),
            timestamp: block.timestamp
        });

        _documentIds.push(documentId);

        emit FileRegistered(documentId, contentHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Adds a new version to an existing document without overwriting previous versions.
     * @param documentId Unique identifier of the document.
     * @param newContentHash SHA-256 hash of the updated canonical document content.
     */
    function addVersion(
        bytes32 documentId,
        bytes32 newContentHash
    ) external onlyRole(ADMIN_ROLE) {
        if (!_documents[documentId].exists) revert DocumentNotFound(documentId);
        if (newContentHash == bytes32(0)) revert InvalidContentHash();

        DocumentRecord storage doc = _documents[documentId];
        uint256 currentVer = doc.currentVersion;
        bytes32 previousHash = _versions[documentId][currentVer].contentHash;

        uint256 nextVer = currentVer + 1;
        doc.currentVersion = nextVer;

        _versions[documentId][nextVer] = DocumentVersion({
            contentHash: newContentHash,
            previousHash: previousHash,
            timestamp: block.timestamp
        });

        emit VersionAdded(
            documentId,
            nextVer,
            newContentHash,
            previousHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Grants download access for a specific document to a user.
     * @param documentId Unique identifier of the document.
     * @param user Ethereum address of the user.
     */
    function grantAccess(
        bytes32 documentId,
        address user
    ) external onlyRole(ADMIN_ROLE) {
        if (!_documents[documentId].exists) revert DocumentNotFound(documentId);
        if (user == address(0)) revert InvalidUserAddress();

        _accessPermissions[documentId][user] = true;

        emit AccessGranted(documentId, user, msg.sender, block.timestamp);
    }

    /**
     * @notice Revokes download access for a specific document from a user.
     * @param documentId Unique identifier of the document.
     * @param user Ethereum address of the user.
     */
    function revokeAccess(
        bytes32 documentId,
        address user
    ) external onlyRole(ADMIN_ROLE) {
        if (!_documents[documentId].exists) revert DocumentNotFound(documentId);
        if (user == address(0)) revert InvalidUserAddress();

        _accessPermissions[documentId][user] = false;

        emit AccessRevoked(documentId, user, msg.sender, block.timestamp);
    }

    /**
     * @notice Checks if a user currently has access to a document.
     * @param documentId Unique identifier of the document.
     * @param user Ethereum address of the user.
     */
    function hasAccess(
        bytes32 documentId,
        address user
    ) public view returns (bool) {
        if (!_documents[documentId].exists || user == address(0)) {
            return false;
        }
        return _accessPermissions[documentId][user];
    }

    /**
     * @notice Records an issuance commitment on-chain before serving the watermarked document.
     * @dev Only callable by accounts with ISSUER_ROLE. The user must currently have access.
     * @param issuanceCommitment Keccak-256 hash of the cryptographically random issuance token.
     * @param documentId Unique identifier of the document.
     * @param version Exact version of the document being issued.
     * @param user Ethereum address of the recipient.
     */
    function recordIssuance(
        bytes32 issuanceCommitment,
        bytes32 documentId,
        uint256 version,
        address user
    ) external onlyRole(ISSUER_ROLE) {
        if (issuanceCommitment == bytes32(0)) revert InvalidCommitment();
        if (_issuances[issuanceCommitment].exists) revert CommitmentAlreadyExists(issuanceCommitment);
        if (!_documents[documentId].exists) revert DocumentNotFound(documentId);
        if (version == 0 || version > _documents[documentId].currentVersion) {
            revert VersionNotFound(documentId, version);
        }
        if (!_accessPermissions[documentId][user]) {
            revert AccessDenied(documentId, user);
        }

        _issuances[issuanceCommitment] = IssuanceRecord({
            commitment: issuanceCommitment,
            documentId: documentId,
            version: version,
            user: user,
            timestamp: block.timestamp,
            exists: true
        });

        _issuanceCommitments.push(issuanceCommitment);

        emit IssuanceRecorded(
            issuanceCommitment,
            documentId,
            version,
            user,
            block.timestamp
        );
    }

    // View / Query Functions

    /**
     * @notice Returns metadata for a registered document.
     */
    function getDocument(
        bytes32 documentId
    ) external view returns (
        bytes32 docId,
        address admin,
        uint256 createdAt,
        uint256 currentVersion,
        bool exists
    ) {
        DocumentRecord storage doc = _documents[documentId];
        return (
            doc.documentId,
            doc.admin,
            doc.createdAt,
            doc.currentVersion,
            doc.exists
        );
    }

    /**
     * @notice Returns details for a specific document version.
     */
    function getDocumentVersion(
        bytes32 documentId,
        uint256 version
    ) external view returns (
        bytes32 contentHash,
        bytes32 previousHash,
        uint256 timestamp
    ) {
        if (!_documents[documentId].exists) revert DocumentNotFound(documentId);
        if (version == 0 || version > _documents[documentId].currentVersion) {
            revert VersionNotFound(documentId, version);
        }

        DocumentVersion storage ver = _versions[documentId][version];
        return (ver.contentHash, ver.previousHash, ver.timestamp);
    }

    /**
     * @notice Returns issuance details for a given commitment.
     */
    function getIssuance(
        bytes32 issuanceCommitment
    ) external view returns (
        bytes32 commitment,
        bytes32 documentId,
        uint256 version,
        address user,
        uint256 timestamp,
        bool exists
    ) {
        IssuanceRecord storage issuance = _issuances[issuanceCommitment];
        return (
            issuance.commitment,
            issuance.documentId,
            issuance.version,
            issuance.user,
            issuance.timestamp,
            issuance.exists
        );
    }

    /**
     * @notice Returns total number of registered documents.
     */
    function getDocumentCount() external view returns (uint256) {
        return _documentIds.length;
    }

    /**
     * @notice Returns all registered document IDs.
     */
    function getAllDocumentIds() external view returns (bytes32[] memory) {
        return _documentIds;
    }

    /**
     * @notice Returns total number of recorded issuances.
     */
    function getIssuanceCount() external view returns (uint256) {
        return _issuanceCommitments.length;
    }

    /**
     * @notice Returns all recorded issuance commitments.
     */
    function getAllIssuanceCommitments() external view returns (bytes32[] memory) {
        return _issuanceCommitments;
    }
}
