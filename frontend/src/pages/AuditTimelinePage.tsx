import React, { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { HashDisplay } from "../components/HashDisplay";
import { api } from "../services/api";
import {
  History,
  FileText,
  KeyRound,
  ShieldCheck,
  SearchCode,
  Filter,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";

export const AuditTimelinePage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [verificationLogs, setVerificationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const [eventsRes, historyRes] = await Promise.all([
        api.get("/blockchain/events"),
        api.get("/forensics/history"),
      ]);
      setEvents(eventsRes.data.events || []);
      setVerificationLogs(historyRes.data.logs || []);
    } catch (err) {
      console.error("Failed to load audit data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  // Merge and sort on-chain events and off-chain forensic checks
  const mergedTimeline = [
    ...events.map((ev) => ({
      type: "blockchain",
      name: ev.name,
      blockNumber: ev.blockNumber,
      txHash: ev.txHash,
      args: ev.args,
      timestamp: ev.args?.timestamp ? Number(ev.args.timestamp) : 0,
    })),
    ...verificationLogs.map((log) => ({
      type: "forensic_log",
      name: log.matched ? "ForensicMatch" : "ForensicScan",
      blockNumber: null,
      txHash: null,
      args: {
        documentId: log.documentId,
        userAddress: log.userAddress,
        notes: log.notes,
        commitment: log.commitment,
      },
      timestamp: log.timestamp,
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  const filteredTimeline = mergedTimeline.filter((item) => {
    if (filterType === "all") return true;
    if (filterType === "blockchain") return item.type === "blockchain";
    if (filterType === "forensics") return item.type === "forensic_log";
    return item.name === filterType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Audit Trail & Activity Log</h2>
          <p className="text-sm text-slate-400">
            Immutable blockchain event log correlated with forensic verification queries
          </p>
        </div>

        {/* Filter Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-navy-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Activities</option>
            <option value="blockchain">On-Chain Events Only</option>
            <option value="forensics">Forensic Scans Only</option>
            <option value="FileRegistered">File Registered</option>
            <option value="VersionAdded">Version Added</option>
            <option value="AccessGranted">Access Granted</option>
            <option value="AccessRevoked">Access Revoked</option>
            <option value="IssuanceRecorded">Issuance Recorded</option>
          </select>
        </div>
      </div>

      {/* Legend & Architecture Note */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
          <span className="text-slate-300">On-Chain EVM Event (Authoritative & Immutable)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <span className="text-slate-300">Off-Chain Forensic Scan Log</span>
        </div>
      </div>

      {/* Timeline Stream */}
      <Card title="Activity Stream" subtitle="Chronological ledger timeline">
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading audit logs...</div>
        ) : filteredTimeline.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No events match the selected filter.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {filteredTimeline.map((item, index) => {
              const isChain = item.type === "blockchain";

              return (
                <div key={index} className="relative group">
                  {/* Timeline Node Icon */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                      isChain
                        ? "bg-navy-950 border-brand-500 text-brand-400"
                        : "bg-navy-950 border-cyan-400 text-cyan-400"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isChain ? "bg-brand-400" : "bg-cyan-400"
                      }`}
                    ></div>
                  </div>

                  <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 text-xs space-y-2 hover:border-slate-700 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            item.name === "FileRegistered"
                              ? "primary"
                              : item.name === "VersionAdded"
                              ? "info"
                              : item.name === "AccessGranted"
                              ? "success"
                              : item.name === "AccessRevoked"
                              ? "danger"
                              : item.name === "IssuanceRecorded"
                              ? "warning"
                              : "mono"
                          }
                        >
                          {item.name}
                        </Badge>
                        <span className="text-[11px] text-slate-400">
                          {isChain ? `Block #${item.blockNumber}` : "Off-Chain Investigation Log"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Clock className="w-3 h-3" />
                        <span>
                          {item.timestamp ? new Date(item.timestamp * 1000).toLocaleString() : "-"}
                        </span>
                      </div>
                    </div>

                    {/* Event Payload Details */}
                    <div className="text-slate-300 space-y-1">
                      {item.args?.documentId && (
                        <div>
                          <span className="text-slate-400 text-[10px]">Document ID: </span>
                          <HashDisplay hash={item.args.documentId} truncateLength={6} />
                        </div>
                      )}
                      {item.args?.contentHash && (
                        <div>
                          <span className="text-slate-400 text-[10px]">Content Hash: </span>
                          <HashDisplay hash={item.args.contentHash} truncateLength={6} />
                        </div>
                      )}
                      {item.args?.version && (
                        <span className="text-slate-300">Version: v{String(item.args.version)} </span>
                      )}
                      {item.args?.user && (
                        <div>
                          <span className="text-slate-400 text-[10px]">User Wallet: </span>
                          <HashDisplay hash={item.args.user} truncateLength={6} />
                        </div>
                      )}
                      {item.args?.issuanceCommitment && (
                        <div>
                          <span className="text-slate-400 text-[10px]">Commitment: </span>
                          <HashDisplay hash={item.args.issuanceCommitment} truncateLength={6} />
                        </div>
                      )}
                      {item.args?.notes && (
                        <p className="text-[11px] text-slate-400 italic mt-0.5">
                          {item.args.notes}
                        </p>
                      )}
                    </div>

                    {item.txHash && (
                      <div className="pt-1 border-t border-slate-850 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Mined Transaction</span>
                        <HashDisplay hash={item.txHash} truncateLength={8} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
