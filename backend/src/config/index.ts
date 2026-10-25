import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load .env from backend directory or root
const envPath = path.resolve(__dirname, "../../.env");
const rootEnvPath = path.resolve(__dirname, "../../../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

// Load deployment info if available
let deployedContractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const deploymentJsonPath = path.resolve(__dirname, "../../../deployment.json");
if (fs.existsSync(deploymentJsonPath)) {
  try {
    const raw = fs.readFileSync(deploymentJsonPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.contractAddress) {
      deployedContractAddress = parsed.contractAddress;
    }
  } catch (err) {
    console.warn("Could not parse deployment.json, using fallback address:", err);
  }
}

export const config = {
  port: parseInt(process.env.PORT || "5001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "dev_jwt_secret_change_in_production_key_2026_dlledg",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  // Blockchain
  rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
  chainId: parseInt(process.env.CHAIN_ID || "31337", 10),
  contractAddress: deployedContractAddress,

  // Private keys (Development Hardhat test accounts)
  adminPrivateKey: process.env.ADMIN_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  issuerPrivateKey: process.env.ISSUER_PRIVATE_KEY || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",

  // Storage
  uploadDir: path.resolve(__dirname, process.env.UPLOAD_DIR || "../../../uploads"),
  storageMode: process.env.STORAGE_MODE || "json",
};

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}
