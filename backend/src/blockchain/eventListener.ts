import { Server as SocketIOServer } from "socket.io";
import { blockchain } from "./contractClient";

export class BlockchainEventListener {
  private io?: SocketIOServer;
  private isListening: boolean = false;

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  public async startListening() {
    if (this.isListening) return;

    try {
      console.log("Initializing Blockchain Event Listener on contract:", blockchain.contractAddress);
      const contract = blockchain.readContract;

      // FileRegistered
      contract.on("FileRegistered", (documentId, contentHash, admin, timestamp, eventPayload) => {
        const eventData = {
          eventName: "FileRegistered",
          documentId,
          contentHash,
          admin,
          timestamp: Number(timestamp),
          txHash: eventPayload?.log?.transactionHash,
          blockNumber: eventPayload?.log?.blockNumber,
        };
        console.log("⚡ Contract Event: FileRegistered", eventData);
        if (this.io) {
          this.io.emit("blockchain:event", eventData);
          this.io.emit("document:registered", eventData);
        }
      });

      // VersionAdded
      contract.on("VersionAdded", (documentId, version, contentHash, previousHash, admin, timestamp, eventPayload) => {
        const eventData = {
          eventName: "VersionAdded",
          documentId,
          version: Number(version),
          contentHash,
          previousHash,
          admin,
          timestamp: Number(timestamp),
          txHash: eventPayload?.log?.transactionHash,
          blockNumber: eventPayload?.log?.blockNumber,
        };
        console.log("⚡ Contract Event: VersionAdded", eventData);
        if (this.io) {
          this.io.emit("blockchain:event", eventData);
          this.io.emit("version:added", eventData);
        }
      });

      // AccessGranted
      contract.on("AccessGranted", (documentId, user, admin, timestamp, eventPayload) => {
        const eventData = {
          eventName: "AccessGranted",
          documentId,
          user,
          admin,
          timestamp: Number(timestamp),
          txHash: eventPayload?.log?.transactionHash,
          blockNumber: eventPayload?.log?.blockNumber,
        };
        console.log("⚡ Contract Event: AccessGranted", eventData);
        if (this.io) {
          this.io.emit("blockchain:event", eventData);
          this.io.emit("access:granted", eventData);
        }
      });

      // AccessRevoked
      contract.on("AccessRevoked", (documentId, user, admin, timestamp, eventPayload) => {
        const eventData = {
          eventName: "AccessRevoked",
          documentId,
          user,
          admin,
          timestamp: Number(timestamp),
          txHash: eventPayload?.log?.transactionHash,
          blockNumber: eventPayload?.log?.blockNumber,
        };
        console.log("⚡ Contract Event: AccessRevoked", eventData);
        if (this.io) {
          this.io.emit("blockchain:event", eventData);
          this.io.emit("access:revoked", eventData);
          this.io.emit("access-revoked", { documentId, userAddress: user });
        }
      });

      // IssuanceRecorded
      contract.on("IssuanceRecorded", (issuanceCommitment, documentId, version, user, timestamp, eventPayload) => {
        const eventData = {
          eventName: "IssuanceRecorded",
          issuanceCommitment,
          documentId,
          version: Number(version),
          user,
          timestamp: Number(timestamp),
          txHash: eventPayload?.log?.transactionHash,
          blockNumber: eventPayload?.log?.blockNumber,
        };
        console.log("⚡ Contract Event: IssuanceRecorded", eventData);
        if (this.io) {
          this.io.emit("blockchain:event", eventData);
          this.io.emit("issuance:recorded", eventData);
        }
      });

      this.isListening = true;
      console.log("Blockchain Event Listener successfully attached.");
    } catch (err) {
      console.error("Failed to start event listener (is local node running?):", err);
    }
  }

  public async queryPastEvents(fromBlock: number = 0) {
    try {
      const contract = blockchain.readContract;
      const filter = {
        address: blockchain.contractAddress,
        fromBlock,
      };
      const logs = await blockchain.provider.getLogs(filter);
      return logs.map((log) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return {
            name: parsed?.name,
            args: parsed?.args,
            blockNumber: log.blockNumber,
            txHash: log.transactionHash,
          };
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (err) {
      console.error("Error querying past events:", err);
      return [];
    }
  }
}

export const eventListener = new BlockchainEventListener();
