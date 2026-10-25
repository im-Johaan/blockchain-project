import React, { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { HashDisplay } from "../components/HashDisplay";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { getSocket } from "../services/socket";
import {
  Download,
  FileText,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  FileCode,
} from "lucide-react";

export const UserPortalPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [lastDownloadedText, setLastDownloadedText] = useState<{
    docTitle: string;
    text: string;
    txHash: string;
    blockNumber: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/documents");
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDocuments();
  }, []);

  // Listen for real-time access revocation notifications
  useEffect(() => {
    const socket = getSocket();
    const handleRevoked = (data: any) => {
      if (data.userAddress?.toLowerCase() === user?.address?.toLowerCase()) {
        fetchUserDocuments();
        setError(`Notice: Your download permission for document ${data.documentId?.slice(0, 10)}... was just revoked on-chain.`);
      }
    };

    socket.on("access:revoked", handleRevoked);
    socket.on("access:granted", () => fetchUserDocuments());

    return () => {
      socket.off("access:revoked", handleRevoked);
      socket.off("access:granted", () => fetchUserDocuments());
    };
  }, [user]);

  const handleDownload = async (docId: string, format: "pdf" | "txt") => {
    try {
      setDownloadingId(docId);
      setError(null);
      setDownloadStatus("Checking on-chain smart contract permission & submitting issuance commitment...");

      const response = await api.get(`/documents/${docId}/download`, {
        params: { format },
        responseType: format === "pdf" ? "blob" : "text",
      });

      const txHash = response.headers["x-issuance-tx"] || "0xMined";
      const blockNumber = response.headers["x-issuance-block"] || "Latest";

      const doc = documents.find((d) => d.id === docId);
      const docTitle = doc ? doc.title : "Document";

      if (format === "txt") {
        setLastDownloadedText({
          docTitle,
          text: response.data,
          txHash,
          blockNumber,
        });
      }

      // Trigger browser download
      const blob =
        format === "pdf"
          ? new Blob([response.data], { type: "application/pdf" })
          : new Blob([response.data], { type: "text/plain;charset=utf-8" });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${docTitle.replace(/\s+/g, "_")}_issued.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setDownloadStatus(`Success! Issuance recorded in Block #${blockNumber} (Tx: ${txHash.slice(0, 12)}...)`);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError("Access Denied: Current on-chain smart contract permissions have been revoked for your address.");
      } else {
        setError(err.response?.data?.error || err.message || "Failed to process download");
      }
      setDownloadStatus(null);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Authorized Document Portal</h2>
        <p className="text-sm text-slate-400">
          Download authorized documents watermarked with unique cryptographic forensic tokens
        </p>
      </div>

      {/* Status banner */}
      {downloadStatus && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-3">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{downloadStatus}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Available Documents List */}
      <Card title="Available Documents" subtitle="Permissions enforced live against DataLeakLedger contract">
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading authorized records...</div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No documents available on the ledger.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {documents.map((doc) => {
              const isDownloading = downloadingId === doc.id;
              const hasAccess = doc.userHasAccess;

              return (
                <div key={doc.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-sm">{doc.title}</span>
                      <Badge variant="info">v{doc.currentVersion}</Badge>
                      {hasAccess ? (
                        <Badge variant="success">ACCESS GRANTED</Badge>
                      ) : (
                        <Badge variant="danger">NO ACCESS</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>Doc ID:</span>
                      <HashDisplay hash={doc.id} truncateLength={5} />
                      <span>SHA-256:</span>
                      <HashDisplay hash={doc.contentHash} truncateLength={5} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={!hasAccess || isDownloading}
                      onClick={() => handleDownload(doc.id, "pdf")}
                      className="px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-all shadow-md shadow-brand-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloading ? "Recording Issuance..." : "Download PDF"}</span>
                    </button>

                    <button
                      disabled={!hasAccess || isDownloading}
                      onClick={() => handleDownload(doc.id, "txt")}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                      title="Download text file with exact zero-width characters for direct leak verification"
                    >
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Text (.txt)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Simulated Leak Copy Helper */}
      {lastDownloadedText && (
        <Card
          title="Simulate Text Leak (Viva Demonstration)"
          subtitle={`Copy marked text from '${lastDownloadedText.docTitle}' with invisible Unicode steganography`}
          glow="cyan"
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">
                Issuance Mined: Block #{lastDownloadedText.blockNumber} (Tx: {lastDownloadedText.txHash.slice(0, 14)}...)
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(lastDownloadedText.text);
                  alert("Copied marked text to clipboard! Paste it into the Forensic Analysis page.");
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Copy Leaked Content to Clipboard</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-lg bg-navy-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-40">
              {lastDownloadedText.text}
            </pre>
            <p className="text-[11px] text-slate-400">
              Note: The text above looks like ordinary plain text, but it contains 256 invisible zero-width Unicode characters encoding your unique issuance commitment recorded on the blockchain.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
