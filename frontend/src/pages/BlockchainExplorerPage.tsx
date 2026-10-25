import React, { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { HashDisplay } from "../components/HashDisplay";
import { api } from "../services/api";
import {
  Blocks,
  ArrowRight,
  Info,
  RefreshCw,
  Clock,
  Layers,
  FileCheck,
  CheckCircle2,
} from "lucide-react";

export const BlockchainExplorerPage: React.FC = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [txLoading, setTxLoading] = useState(false);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const res = await api.get("/blockchain/blocks?limit=15");
      setBlocks(res.data.blocks || []);
    } catch (err) {
      console.error("Failed to load blocks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
    const interval = setInterval(fetchBlocks, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleInspectTx = async (txHash: string) => {
    try {
      setTxLoading(true);
      const res = await api.get(`/blockchain/transactions/${txHash}`);
      setSelectedTx(res.data);
    } catch (err: any) {
      alert("Could not load transaction: " + err.message);
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">EVM Blockchain Explorer</h2>
          <p className="text-sm text-slate-400">
            Direct ledger inspection: block headers, cryptographic block hashes, transaction receipts, and gas
          </p>
        </div>
        <button
          onClick={fetchBlocks}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Consensus & Limitations Notice (Required by Section 5 of Spec) */}
      <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Consensus Architecture & Local Network Context (Viva Defense)</span>
        </div>
        <p className="leading-relaxed">
          This explorer connects to an EVM local blockchain network (Chain ID: 31337). Blocks are produced deterministically as transactions are submitted. Hardhat simulates state execution and gas economics. In enterprise production, multi-validator consensus (such as QBFT or Proof-of-Authority) guarantees distributed agreement among independent organizations.
        </p>
      </div>

      {/* Block Stream Table */}
      <Card
        title={`Recent Mined Blocks (${blocks.length})`}
        subtitle="Chronological sequence of EVM blocks containing audit and issuance transactions"
      >
        {loading && blocks.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">Connecting to RPC node...</div>
        ) : blocks.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">No blocks mined yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Block Height</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Transactions</th>
                  <th className="py-3 px-4">Block Hash</th>
                  <th className="py-3 px-4">Parent Block Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {blocks.map((b) => (
                  <tr key={b.number} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-brand-400 text-sm">
                        #{b.number}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(b.timestamp * 1000).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {b.transactionCount > 0 ? (
                        <div className="space-y-1">
                          <Badge variant="primary">{b.transactionCount} tx</Badge>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {b.transactions.map((tx: any, idx: number) => {
                              const hash = typeof tx === "string" ? tx : tx.hash;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleInspectTx(hash)}
                                  className="text-[10px] font-mono text-cyan-400 hover:underline"
                                  title="Inspect Transaction"
                                >
                                  {hash.slice(0, 8)}...
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">0 tx</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <HashDisplay hash={b.hash} truncateLength={6} />
                    </td>
                    <td className="py-3.5 px-4">
                      <HashDisplay hash={b.parentHash} truncateLength={6} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">Transaction Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 space-y-2">
                <div>
                  <span className="text-slate-400 text-[10px]">Transaction Hash: </span>
                  <HashDisplay hash={selectedTx.tx?.hash} truncateLength={12} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Block Number:</span>
                  <span className="font-mono text-white">#{selectedTx.receipt?.blockNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  <Badge variant={selectedTx.receipt?.status === 1 ? "success" : "danger"}>
                    {selectedTx.receipt?.status === 1 ? "SUCCESS (MINED)" : "REVERTED"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">From (Signer):</span>
                  <HashDisplay hash={selectedTx.tx?.from} truncateLength={8} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">To (DataLeakLedger):</span>
                  <HashDisplay hash={selectedTx.tx?.to} truncateLength={8} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Gas Used:</span>
                  <span className="font-mono text-slate-300">
                    {selectedTx.receipt?.gasUsed ? BigInt(selectedTx.receipt.gasUsed).toString() : "-"}
                  </span>
                </div>
              </div>

              {selectedTx.receipt?.logs && selectedTx.receipt.logs.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Emitted Event Logs ({selectedTx.receipt.logs.length})
                  </h4>
                  <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                    {selectedTx.receipt.logs.map((log: any, idx: number) => (
                      <div key={idx} className="border-b border-slate-850 pb-1">
                        <div>Topic0: {log.topics ? log.topics[0]?.slice(0, 20) : "-"}...</div>
                        <div>Data: {log.data?.slice(0, 30)}...</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
