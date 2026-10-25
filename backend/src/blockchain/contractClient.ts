import { ethers } from "ethers";
import path from "path";
import fs from "fs";
import { config } from "../config";

// Read contract ABI from Hardhat artifacts
function loadContractAbi(): any[] {
  const artifactPath = path.resolve(
    __dirname,
    "../../../../artifacts/contracts/DataLeakLedger.sol/DataLeakLedger.json"
  );
  if (fs.existsSync(artifactPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
      return parsed.abi;
    } catch (err) {
      console.warn("Could not read artifact JSON, using fallback ABI:", err);
    }
  }

  // Fallback ABI if artifact is not compiled yet
  return [
    "function registerDocument(bytes32 documentId, bytes32 contentHash) external",
    "function addVersion(bytes32 documentId, bytes32 newContentHash) external",
    "function grantAccess(bytes32 documentId, address user) external",
    "function revokeAccess(bytes32 documentId, address user) external",
    "function hasAccess(bytes32 documentId, address user) external view returns (bool)",
    "function recordIssuance(bytes32 issuanceCommitment, bytes32 documentId, uint256 version, address user) external",
    "function getDocument(bytes32 documentId) external view returns (bytes32 docId, address admin, uint256 createdAt, uint256 currentVersion, bool exists)",
    "function getDocumentVersion(bytes32 documentId, uint256 version) external view returns (bytes32 contentHash, bytes32 previousHash, uint256 timestamp)",
    "function getIssuance(bytes32 issuanceCommitment) external view returns (bytes32 commitment, bytes32 documentId, uint256 version, address user, uint256 timestamp, bool exists)",
    "function getDocumentCount() external view returns (uint256)",
    "function getAllDocumentIds() external view returns (bytes32[])",
    "function getIssuanceCount() external view returns (uint256)",
    "function getAllIssuanceCommitments() external view returns (bytes32[])",
    "event FileRegistered(bytes32 indexed documentId, bytes32 contentHash, address indexed admin, uint256 timestamp)",
    "event VersionAdded(bytes32 indexed documentId, uint256 indexed version, bytes32 contentHash, bytes32 previousHash, address indexed admin, uint256 timestamp)",
    "event AccessGranted(bytes32 indexed documentId, address indexed user, address indexed admin, uint256 timestamp)",
    "event AccessRevoked(bytes32 indexed documentId, address indexed user, address indexed admin, uint256 timestamp)",
    "event IssuanceRecorded(bytes32 indexed issuanceCommitment, bytes32 indexed documentId, uint256 version, address indexed user, uint256 timestamp)",
  ];
}

export class BlockchainClient {
  public provider: ethers.JsonRpcProvider;
  public adminWallet: ethers.Wallet;
  public issuerWallet: ethers.Wallet;
  public contractAddress: string;
  public abi: any[];
  public adminContract: ethers.Contract;
  public issuerContract: ethers.Contract;
  public readContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.adminWallet = new ethers.Wallet(config.adminPrivateKey, this.provider);
    this.issuerWallet = new ethers.Wallet(config.issuerPrivateKey, this.provider);
    this.contractAddress = config.contractAddress;
    this.abi = loadContractAbi();

    this.adminContract = new ethers.Contract(this.contractAddress, this.abi, this.adminWallet);
    this.issuerContract = new ethers.Contract(this.contractAddress, this.abi, this.issuerWallet);
    this.readContract = new ethers.Contract(this.contractAddress, this.abi, this.provider);
  }

  public updateContractAddress(address: string) {
    this.contractAddress = address;
    this.adminContract = new ethers.Contract(address, this.abi, this.adminWallet);
    this.issuerContract = new ethers.Contract(address, this.abi, this.issuerWallet);
    this.readContract = new ethers.Contract(address, this.abi, this.provider);
  }

  // --- Transactions ---

  public async registerDocument(documentId: string, contentHash: string) {
    const tx = await this.adminContract.registerDocument(documentId, contentHash);
    const receipt = await tx.wait();
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  public async addVersion(documentId: string, newContentHash: string) {
    const tx = await this.adminContract.addVersion(documentId, newContentHash);
    const receipt = await tx.wait();
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  public async grantAccess(documentId: string, userAddress: string) {
    const tx = await this.adminContract.grantAccess(documentId, userAddress);
    const receipt = await tx.wait();
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  public async revokeAccess(documentId: string, userAddress: string) {
    const tx = await this.adminContract.revokeAccess(documentId, userAddress);
    const receipt = await tx.wait();
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  public async recordIssuance(
    issuanceCommitment: string,
    documentId: string,
    version: number,
    userAddress: string
  ) {
    const tx = await this.issuerContract.recordIssuance(
      issuanceCommitment,
      documentId,
      version,
      userAddress
    );
    const receipt = await tx.wait();
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  // --- Read Queries ---

  public async hasAccess(documentId: string, userAddress: string): Promise<boolean> {
    try {
      return await this.readContract.hasAccess(documentId, userAddress);
    } catch (err) {
      console.error(`Error querying on-chain access for ${documentId} / ${userAddress}:`, err);
      return false;
    }
  }

  public async getDocument(documentId: string) {
    const [docId, admin, createdAt, currentVersion, exists] =
      await this.readContract.getDocument(documentId);
    return {
      docId,
      admin,
      createdAt: Number(createdAt),
      currentVersion: Number(currentVersion),
      exists,
    };
  }

  public async getDocumentVersion(documentId: string, version: number) {
    const [contentHash, previousHash, timestamp] =
      await this.readContract.getDocumentVersion(documentId, version);
    return {
      contentHash,
      previousHash,
      timestamp: Number(timestamp),
    };
  }

  public async getIssuance(issuanceCommitment: string) {
    const [commitment, documentId, version, user, timestamp, exists] =
      await this.readContract.getIssuance(issuanceCommitment);
    return {
      commitment,
      documentId,
      version: Number(version),
      user,
      timestamp: Number(timestamp),
      exists,
    };
  }

  public async getDocumentCount(): Promise<number> {
    const count = await this.readContract.getDocumentCount();
    return Number(count);
  }

  public async getIssuanceCount(): Promise<number> {
    const count = await this.readContract.getIssuanceCount();
    return Number(count);
  }

  // --- Blockchain Explorer & Audit Support ---

  public async getNetworkStatus() {
    const blockNumber = await this.provider.getBlockNumber();
    const network = await this.provider.getNetwork();
    return {
      blockNumber,
      chainId: Number(network.chainId),
      networkName: network.name,
      contractAddress: this.contractAddress,
    };
  }

  public async getRecentBlocks(limit: number = 10) {
    const currentBlockNumber = await this.provider.getBlockNumber();
    const blocks = [];
    const start = Math.max(0, currentBlockNumber - limit + 1);

    for (let i = currentBlockNumber; i >= start; i--) {
      const block = await this.provider.getBlock(i, true);
      if (block) {
        blocks.push({
          number: block.number,
          hash: block.hash,
          parentHash: block.parentHash,
          timestamp: block.timestamp,
          transactionCount: block.transactions.length,
          transactions: block.transactions,
        });
      }
    }
    return blocks;
  }

  public async getTransactionWithReceipt(txHash: string) {
    const tx = await this.provider.getTransaction(txHash);
    const receipt = await this.provider.getTransactionReceipt(txHash);
    return { tx, receipt };
  }
}

export const blockchain = new BlockchainClient();
