import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { HashDisplay } from "../components/HashDisplay";
import { api } from "../services/api";
import {
  FileText,
  Layers,
  Key,
  ShieldCheck,
  Blocks,
  Upload,
  SearchCode,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

export const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalVersions: 0,
    totalIssuances: 0,
    activeGrants: 0,
    currentBlock: 0,
    contractAddress: "",
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statusRes, docsRes, eventsRes] = await Promise.all([
        api.get("/blockchain/status"),
        api.get("/documents"),
        api.get("/blockchain/events"),
      ]);

      const docs = docsRes.data.documents || [];
      const totalVersions = docs.reduce(
        (acc: number, d: any) => acc + (d.versions?.length || 1),
        0
      );

      // Count grants from events
      const events = eventsRes.data.events || [];
      const grants = events.filter((e: any) => e.name === "AccessGranted").length;

      setStats({
        totalDocuments: statusRes.data.totalDocuments || docs.length,
        totalVersions,
        totalIssuances: statusRes.data.totalIssuances || 0,
        activeGrants: grants,
        currentBlock: statusRes.data.blockNumber || 0,
        contractAddress: statusRes.data.contractAddress || "",
      });

      setRecentEvents(events.slice(-6).reverse());
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security & Audit Overview</h2>
          <p className="text-sm text-slate-400">
            Real-time telemetry from DataLeakLedger smart contract and forensic registry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh State</span>
          </button>
          <Link
            to="/documents"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors shadow-lg shadow-brand-600/20"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Register Document</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Registered Documents</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.totalDocuments}</h3>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <span>On-chain unique IDs</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Document Versions</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.totalVersions}</h3>
              <p className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
                <span>Immutable version tree</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Recorded Issuances</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.totalIssuances}</h3>
              <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                <span>Keccak-256 commitments</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Current Block Height</p>
              <h3 className="text-2xl font-bold text-white mt-1 font-mono">#{stats.currentBlock}</h3>
              <p className="text-[11px] text-indigo-400 mt-1 flex items-center gap-1">
                <span>Chain ID: 31337</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Blocks className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Contract & Trust Model Notice */}
      <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="font-semibold text-slate-200">Deployed Contract: </span>
          <HashDisplay hash={stats.contractAddress} truncateLength={10} />
          <p className="text-[11px] text-slate-400 mt-1">
            DataLeakLedger is authoritative for document IDs, content SHA-256 hashes, permission grants/revocations, and issuance commitments.
          </p>
        </div>
        <Link
          to="/forensics"
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
        >
          <SearchCode className="w-3.5 h-3.5 text-brand-400" />
          <span>Launch Forensic Analyzer</span>
        </Link>
      </div>

      {/* Recent Smart Contract Activity */}
      <Card
        title="Live Smart Contract Events"
        subtitle="Recent state mutations mined on the local Ethereum network"
        action={
          <Link
            to="/audit"
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
          >
            <span>Full Audit Trail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {recentEvents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No on-chain events recorded yet. Register a document to create the first event.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {recentEvents.map((ev, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      ev.name === "FileRegistered"
                        ? "primary"
                        : ev.name === "VersionAdded"
                        ? "info"
                        : ev.name === "AccessGranted"
                        ? "success"
                        : ev.name === "AccessRevoked"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {ev.name}
                  </Badge>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Block #{ev.blockNumber}
                  </span>
                </div>
                <HashDisplay hash={ev.txHash} truncateLength={6} label="Tx" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
