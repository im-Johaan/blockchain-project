import React, { useState } from "react";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { HashDisplay } from "../components/HashDisplay";
import { api } from "../services/api";
import { IssuanceVerificationResult } from "../../../shared/types";
import {
  SearchCode,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  User,
  FileText,
  Layers,
} from "lucide-react";

export const ForensicsPage: React.FC = () => {
  const [leakedText, setLeakedText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<IssuanceVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leakedText.trim()) {
      setError("Please paste the leaked text snippet for forensic analysis.");
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setResult(null);

      const res = await api.post("/forensics/verify", { leakedText });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Forensic analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Forensic Leak Attribution Portal</h2>
        <p className="text-sm text-slate-400">
          Extract invisible zero-width Unicode steganography markers and verify commitments against DataLeakLedger on-chain records
        </p>
      </div>

      {/* Input Box Card */}
      <Card
        title="Analyze Suspect Leaked Content"
        subtitle="Paste suspect text from emails, public forums, chat logs, or leaked documents"
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <textarea
              rows={7}
              value={leakedText}
              onChange={(e) => setLeakedText(e.target.value)}
              placeholder="Paste leaked text here. Even if zero-width characters are completely invisible to the human eye, the parser will extract the 256-bit token frame..."
              className="w-full bg-navy-950 border border-slate-800 rounded-lg p-3.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Payload length: {leakedText.length} characters
            </span>
            <button
              type="submit"
              disabled={analyzing}
              className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              <SearchCode className="w-4 h-4" />
              <span>{analyzing ? "Extracting & Verifying On-Chain..." : "Analyze Leaked Text"}</span>
            </button>
          </div>
        </form>
      </Card>

      {/* Verification Result Section */}
      {result && (
        <Card
          title={
            <div className="flex items-center gap-2">
              {result.matched ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : result.tokenFound ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              )}
              <span>
                {result.matched
                  ? "Positive Match: Blockchain Issuance Identified"
                  : result.tokenFound
                  ? "Marker Detected but Unregistered"
                  : "No Steganographic Markers Found"}
              </span>
            </div>
          }
          glow={result.matched ? "cyan" : "none"}
        >
          <div className="space-y-4 text-xs">
            <div
              className={`p-3.5 rounded-lg border ${
                result.matched
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : result.tokenFound
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}
            >
              <p className="font-medium">{result.details}</p>
            </div>

            {result.matched && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2.5">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Issuance Attribution
                  </h4>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-400" />
                    <span className="text-slate-400">Recipient Account:</span>
                    <span className="font-semibold text-white">{result.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Wallet Address:</span>
                    <HashDisplay hash={result.userAddress || ""} truncateLength={6} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span className="text-slate-400">Issued Timestamp:</span>
                    <span className="text-slate-200">
                      {result.timestamp ? new Date(result.timestamp * 1000).toLocaleString() : "-"}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2.5">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Document & Version Trace
                  </h4>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-400">Document:</span>
                    <span className="font-semibold text-white">{result.documentTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-400">Exact Issued Version:</span>
                    <Badge variant="info">v{result.version}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Keccak-256 Commitment:</span>
                    <HashDisplay hash={result.commitment || ""} truncateLength={6} />
                  </div>
                </div>
              </div>
            )}

            {/* Scope and Trust Assumptions Explanation as required by spec */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Info className="w-4 h-4 text-brand-400" />
                <span>Forensic Interpretation & Viva Defense Notes</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>
                  <strong className="text-slate-300">What this proves:</strong> The leaked text contains an intact cryptographic marker whose Keccak-256 commitment was mined on the DataLeakLedger contract when a specific authorized copy was issued.
                </li>
                <li>
                  <strong className="text-slate-300">What this does NOT prove:</strong> It does not prove who physically pressed copy-paste, who owned the computer where the file was saved, or whether the recipient's computer or credentials were compromised.
                </li>
                <li>
                  <strong className="text-slate-300">Limitations:</strong> Markers can be removed by retyping text, photographing screens, or piping text through character normalizers that filter non-printable Unicode.
                </li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
