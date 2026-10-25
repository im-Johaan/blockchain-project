import { expect } from "chai";
import { ethers } from "hardhat";
import { DataLeakLedger } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("DataLeakLedger", function () {
  let ledger: DataLeakLedger;
  let admin: SignerWithAddress;
  let issuer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const sampleDocId = ethers.keccak256(ethers.toUtf8Bytes("DOC-2026-001"));
  const sampleContentHash1 = ethers.sha256(ethers.toUtf8Bytes("Document Version 1 Content"));
  const sampleContentHash2 = ethers.sha256(ethers.toUtf8Bytes("Document Version 2 Content Updated"));
  const sampleCommitment1 = ethers.keccak256(ethers.toUtf8Bytes("cryptographic-random-token-001"));
  const sampleCommitment2 = ethers.keccak256(ethers.toUtf8Bytes("cryptographic-random-token-002"));

  beforeEach(async function () {
    [admin, issuer, user1, user2, unauthorized] = await ethers.getSigners();

    const DataLeakLedgerFactory = await ethers.getContractFactory("DataLeakLedger");
    ledger = await DataLeakLedgerFactory.deploy(admin.address, issuer.address);
    await ledger.waitForDeployment();
  });

  describe("Deployment and Roles", function () {
    it("should set up admin and issuer roles correctly", async function () {
      const ADMIN_ROLE = await ledger.ADMIN_ROLE();
      const ISSUER_ROLE = await ledger.ISSUER_ROLE();
      const DEFAULT_ADMIN_ROLE = await ledger.DEFAULT_ADMIN_ROLE();

      expect(await ledger.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await ledger.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
      expect(await ledger.hasRole(ISSUER_ROLE, issuer.address)).to.be.true;
      expect(await ledger.hasRole(ADMIN_ROLE, unauthorized.address)).to.be.false;
      expect(await ledger.hasRole(ISSUER_ROLE, unauthorized.address)).to.be.false;
    });
  });

  describe("Document Registration", function () {
    it("should register a new document and emit FileRegistered event", async function () {
      const tx = await ledger.connect(admin).registerDocument(sampleDocId, sampleContentHash1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(ledger, "FileRegistered")
        .withArgs(sampleDocId, sampleContentHash1, admin.address, block!.timestamp);

      const doc = await ledger.getDocument(sampleDocId);
      expect(doc.docId).to.equal(sampleDocId);
      expect(doc.admin).to.equal(admin.address);
      expect(doc.currentVersion).to.equal(1n);
      expect(doc.exists).to.be.true;

      const ver1 = await ledger.getDocumentVersion(sampleDocId, 1);
      expect(ver1.contentHash).to.equal(sampleContentHash1);
      expect(ver1.previousHash).to.equal(ethers.ZeroHash);
      expect(ver1.timestamp).to.equal(block!.timestamp);

      expect(await ledger.getDocumentCount()).to.equal(1n);
      const ids = await ledger.getAllDocumentIds();
      expect(ids[0]).to.equal(sampleDocId);
    });

    it("should reject duplicate document registration", async function () {
      await ledger.connect(admin).registerDocument(sampleDocId, sampleContentHash1);

      await expect(
        ledger.connect(admin).registerDocument(sampleDocId, sampleContentHash1)
      ).to.be.revertedWithCustomError(ledger, "DocumentAlreadyExists")
        .withArgs(sampleDocId);
    });

    it("should reject zero document ID or zero content hash", async function () {
      await expect(
        ledger.connect(admin).registerDocument(ethers.ZeroHash, sampleContentHash1)
      ).to.be.revertedWithCustomError(ledger, "InvalidIdentifier");

      await expect(
        ledger.connect(admin).registerDocument(sampleDocId, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(ledger, "InvalidContentHash");
    });

    it("should reject document registration from unauthorized accounts", async function () {
      await expect(
        ledger.connect(unauthorized).registerDocument(sampleDocId, sampleContentHash1)
      ).to.be.revertedWithCustomError(ledger, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Document Versioning", function () {
    beforeEach(async function () {
      await ledger.connect(admin).registerDocument(sampleDocId, sampleContentHash1);
    });

    it("should add a new version and preserve historical version records", async function () {
      const tx = await ledger.connect(admin).addVersion(sampleDocId, sampleContentHash2);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(ledger, "VersionAdded")
        .withArgs(sampleDocId, 2n, sampleContentHash2, sampleContentHash1, admin.address, block!.timestamp);

      const doc = await ledger.getDocument(sampleDocId);
      expect(doc.currentVersion).to.equal(2n);

      // Verify version 1 remains intact
      const ver1 = await ledger.getDocumentVersion(sampleDocId, 1);
      expect(ver1.contentHash).to.equal(sampleContentHash1);
      expect(ver1.previousHash).to.equal(ethers.ZeroHash);

      // Verify version 2 has reference to version 1
      const ver2 = await ledger.getDocumentVersion(sampleDocId, 2);
      expect(ver2.contentHash).to.equal(sampleContentHash2);
      expect(ver2.previousHash).to.equal(sampleContentHash1);
      expect(ver2.timestamp).to.equal(block!.timestamp);
    });

    it("should reject adding version to non-existent document", async function () {
      const nonExistentDocId = ethers.keccak256(ethers.toUtf8Bytes("NON-EXISTENT"));
      await expect(
        ledger.connect(admin).addVersion(nonExistentDocId, sampleContentHash2)
      ).to.be.revertedWithCustomError(ledger, "DocumentNotFound")
        .withArgs(nonExistentDocId);
    });

    it("should reject zero content hash for new version", async function () {
      await expect(
        ledger.connect(admin).addVersion(sampleDocId, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(ledger, "InvalidContentHash");
    });

    it("should reject adding version from non-admin account", async function () {
      await expect(
        ledger.connect(unauthorized).addVersion(sampleDocId, sampleContentHash2)
      ).to.be.revertedWithCustomError(ledger, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Access Control & Permissions", function () {
    beforeEach(async function () {
      await ledger.connect(admin).registerDocument(sampleDocId, sampleContentHash1);
    });

    it("should grant access and emit AccessGranted event", async function () {
      expect(await ledger.hasAccess(sampleDocId, user1.address)).to.be.false;

      const tx = await ledger.connect(admin).grantAccess(sampleDocId, user1.address);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(ledger, "AccessGranted")
        .withArgs(sampleDocId, user1.address, admin.address, block!.timestamp);

      expect(await ledger.hasAccess(sampleDocId, user1.address)).to.be.true;
    });

    it("should revoke access and emit AccessRevoked event", async function () {
      await ledger.connect(admin).grantAccess(sampleDocId, user1.address);
      expect(await ledger.hasAccess(sampleDocId, user1.address)).to.be.true;

      const tx = await ledger.connect(admin).revokeAccess(sampleDocId, user1.address);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(ledger, "AccessRevoked")
        .withArgs(sampleDocId, user1.address, admin.address, block!.timestamp);

      expect(await ledger.hasAccess(sampleDocId, user1.address)).to.be.false;
    });

    it("should reject grant or revoke from unauthorized accounts", async function () {
      await expect(
        ledger.connect(unauthorized).grantAccess(sampleDocId, user1.address)
      ).to.be.revertedWithCustomError(ledger, "AccessControlUnauthorizedAccount");

      await expect(
        ledger.connect(unauthorized).revokeAccess(sampleDocId, user1.address)
      ).to.be.revertedWithCustomError(ledger, "AccessControlUnauthorizedAccount");
    });

    it("should reject grant or revoke for non-existent document or zero address", async function () {
      const fakeDocId = ethers.keccak256(ethers.toUtf8Bytes("NON-EXISTENT"));
      await expect(
        ledger.connect(admin).grantAccess(fakeDocId, user1.address)
      ).to.be.revertedWithCustomError(ledger, "DocumentNotFound");

      await expect(
        ledger.connect(admin).grantAccess(sampleDocId, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(ledger, "InvalidUserAddress");
    });
  });

  describe("Issuance Registry", function () {
    beforeEach(async function () {
      await ledger.connect(admin).registerDocument(sampleDocId, sampleContentHash1);
      await ledger.connect(admin).grantAccess(sampleDocId, user1.address);
    });

    it("should record issuance commitment for authorized user and emit IssuanceRecorded", async function () {
      const tx = await ledger.connect(issuer).recordIssuance(
        sampleCommitment1,
        sampleDocId,
        1,
        user1.address
      );
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(ledger, "IssuanceRecorded")
        .withArgs(sampleCommitment1, sampleDocId, 1n, user1.address, block!.timestamp);

      const issuance = await ledger.getIssuance(sampleCommitment1);
      expect(issuance.commitment).to.equal(sampleCommitment1);
      expect(issuance.documentId).to.equal(sampleDocId);
      expect(issuance.version).to.equal(1n);
      expect(issuance.user).to.equal(user1.address);
      expect(issuance.timestamp).to.equal(block!.timestamp);
      expect(issuance.exists).to.be.true;

      expect(await ledger.getIssuanceCount()).to.equal(1n);
      const commitments = await ledger.getAllIssuanceCommitments();
      expect(commitments[0]).to.equal(sampleCommitment1);
    });

    it("should reject duplicate issuance commitments", async function () {
      await ledger.connect(issuer).recordIssuance(
        sampleCommitment1,
        sampleDocId,
        1,
        user1.address
      );

      await expect(
        ledger.connect(issuer).recordIssuance(
          sampleCommitment1,
          sampleDocId,
          1,
          user1.address
        )
      ).to.be.revertedWithCustomError(ledger, "CommitmentAlreadyExists")
        .withArgs(sampleCommitment1);
    });

    it("should reject zero commitment", async function () {
      await expect(
        ledger.connect(issuer).recordIssuance(
          ethers.ZeroHash,
          sampleDocId,
          1,
          user1.address
        )
      ).to.be.revertedWithCustomError(ledger, "InvalidCommitment");
    });

    it("should reject issuance call from unauthorized non-issuer account", async function () {
      await expect(
        ledger.connect(unauthorized).recordIssuance(
          sampleCommitment1,
          sampleDocId,
          1,
          user1.address
        )
      ).to.be.revertedWithCustomError(ledger, "AccessControlUnauthorizedAccount");
    });

    it("should reject issuance when user has no access", async function () {
      await expect(
        ledger.connect(issuer).recordIssuance(
          sampleCommitment2,
          sampleDocId,
          1,
          user2.address
        )
      ).to.be.revertedWithCustomError(ledger, "AccessDenied")
        .withArgs(sampleDocId, user2.address);
    });

    it("should reject issuance when user's access has been revoked", async function () {
      await ledger.connect(admin).revokeAccess(sampleDocId, user1.address);

      await expect(
        ledger.connect(issuer).recordIssuance(
          sampleCommitment1,
          sampleDocId,
          1,
          user1.address
        )
      ).to.be.revertedWithCustomError(ledger, "AccessDenied")
        .withArgs(sampleDocId, user1.address);
    });

    it("should reject issuance for nonexistent document or invalid version", async function () {
      const fakeDocId = ethers.keccak256(ethers.toUtf8Bytes("NON-EXISTENT"));
      await expect(
        ledger.connect(issuer).recordIssuance(
          sampleCommitment1,
          fakeDocId,
          1,
          user1.address
        )
      ).to.be.revertedWithCustomError(ledger, "DocumentNotFound");

      // Version 0
      await expect(
        ledger.connect(issuer).recordIssuance(
          sampleCommitment1,
          sampleDocId,
          0,
          user1.address
        )
      ).to.be.revertedWithCustomError(ledger, "VersionNotFound")
        .withArgs(sampleDocId, 0n);

      // Version 99 (exceeds current version 1)
      await expect(
        ledger.connect(issuer).recordIssuance(
          sampleCommitment1,
          sampleDocId,
          99,
          user1.address
        )
      ).to.be.revertedWithCustomError(ledger, "VersionNotFound")
        .withArgs(sampleDocId, 99n);
    });
  });
});
