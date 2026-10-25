import React, { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { HashDisplay } from "../components/HashDisplay";
import { api } from "../services/api";
import { getSocket } from "../services/socket";
import { DocumentRecord } from "../../../shared/types";
import {
  KeyRound,
  UserCheck,
  UserX,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface PermissionRow {
  userId: string;
  username: string;
  address: string;
  role: string;
  hasAccess: boolean;
}

export const AccessControlPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load documents
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get("/documents");
        const docs = res.data.documents || [];
        setDocuments(docs);
        if (docs.length > 0 && !selectedDocId) {
          setSelectedDocId(docs[0].id);
        }
      } catch (err) {
        console.error("Failed to load documents:", err);
      }
    };
    fetchDocs();
  }, []);

  // Fetch permissions when selectedDocId changes
  const fetchPermissions = async (docId: string) => {
    if (!docId) return;
    try {
      setLoading(true);
      const res = await api.get(`/documents/${docId}/access`);
      setPermissions(res.data.permissions || []);
    } catch (err) {
      console.error("Failed to load permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDocId) {
      fetchPermissions(selectedDocId);
    }
  }, [selectedDocId]);

  // Listen to live WebSocket events for instant UI synchronization
  useEffect(() => {
    const socket = getSocket();
    const handleAccessChange = (data: any) => {
      if (data.documentId === selectedDocId) {
        fetchPermissions(selectedDocId);
      }
    };

    socket.on("access:granted", handleAccessChange);
    socket.on("access:revoked", handleAccessChange);

    return () => {
      socket.off("access:granted", handleAccessChange);
      socket.off("access:revoked", handleAccessChange);
    };
  }, [selectedDocId]);

  const handleGrant = async (userAddress: string, username: string) => {
    try {
      setActionLoading(userAddress);
      setFeedback(null);
      const res = await api.post(`/documents/${selectedDocId}/access`, { userAddress });
      setFeedback({
        type: "success",
        message: `Granted on-chain access to ${username}! Tx: ${res.data.transaction?.txHash?.slice(0, 14)}...`,
      });
      await fetchPermissions(selectedDocId);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.response?.data?.details || err.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (userAddress: string, username: string) => {
    try {
      setActionLoading(userAddress);
      setFeedback(null);
      const res = await api.delete(`/documents/${selectedDocId}/access/${userAddress}`);
      setFeedback({
        type: "success",
        message: `Revoked on-chain access from ${username}! Tx: ${res.data.transaction?.txHash?.slice(0, 14)}...`,
      });
      await fetchPermissions(selectedDocId);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.response?.data?.details || err.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">On-Chain Access Management</h2>
        <p className="text-sm text-slate-400">
          Smart contract enforced permission control. Revocations prevent future downloads in real time.
        </p>
      </div>

      {/* Document Selection Card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full md:max-w-md">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Select Document to Manage
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title} (v{doc.currentVersion})
                </option>
              ))}
            </select>
          </div>

          {selectedDoc && (
            <div className="text-xs space-y-1">
              <div>
                <span className="text-slate-400">Document ID: </span>
                <HashDisplay hash={selectedDoc.id} truncateLength={6} />
              </div>
              <div>
                <span className="text-slate-400">Current Hash: </span>
                <HashDisplay hash={selectedDoc.contentHash} truncateLength={6} />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Permissions Table */}
      <Card
        title="Wallet Access Permissions"
        subtitle="On-chain smart contract permission status for registered personas"
        action={
          <button
            onClick={() => selectedDocId && fetchPermissions(selectedDocId)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        }
      >
        {permissions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            {selectedDocId ? "No users found" : "Select a document above"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Ethereum Wallet</th>
                  <th className="py-3 px-4">On-Chain Access</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {permissions.map((p) => {
                  const isOperating = actionLoading === p.address;
                  return (
                    <tr key={p.userId} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {p.username}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={p.role === "admin" ? "primary" : "mono"}>
                          {p.role}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <HashDisplay hash={p.address} truncateLength={6} />
                      </td>
                      <td className="py-3.5 px-4">
                        {p.hasAccess ? (
                          <Badge variant="success">AUTHORIZED</Badge>
                        ) : (
                          <Badge variant="danger">NO ACCESS</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {p.hasAccess ? (
                          <button
                            disabled={isOperating}
                            onClick={() => handleRevoke(p.address, p.username)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>{isOperating ? "Revoking..." : "Revoke Access"}</span>
                          </button>
                        ) : (
                          <button
                            disabled={isOperating}
                            onClick={() => handleGrant(p.address, p.username)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{isOperating ? "Granting..." : "Grant Access"}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
