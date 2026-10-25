import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer, issuer] = await ethers.getSigners();
  console.log("----------------------------------------------------");
  console.log("Deploying DataLeakLedger contract...");
  console.log("Deployer (Admin):", deployer.address);
  console.log("Issuer Account:   ", issuer ? issuer.address : deployer.address);

  const issuerAddress = issuer ? issuer.address : deployer.address;

  const DataLeakLedgerFactory = await ethers.getContractFactory("DataLeakLedger");
  const ledger = await DataLeakLedgerFactory.deploy(deployer.address, issuerAddress);
  await ledger.waitForDeployment();

  const contractAddress = await ledger.getAddress();
  const deploymentTx = ledger.deploymentTransaction();
  const receipt = deploymentTx ? await deploymentTx.wait() : null;

  console.log("DataLeakLedger deployed to:", contractAddress);
  if (deploymentTx) {
    console.log("Deployment Tx Hash:        ", deploymentTx.hash);
    console.log("Mined in Block Number:     ", receipt ? receipt.blockNumber : "unknown");
  }
  console.log("----------------------------------------------------");

  // Write deployment info to deployment.json for backend & frontend
  const deploymentData = {
    contractAddress,
    adminAddress: deployer.address,
    issuerAddress: issuerAddress,
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
    txHash: deploymentTx ? deploymentTx.hash : null,
    blockNumber: receipt ? receipt.blockNumber : null,
  };

  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log("Saved deployment details to:", deploymentPath);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
