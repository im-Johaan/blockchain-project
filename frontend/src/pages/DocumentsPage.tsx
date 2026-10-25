import React, { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { HashDisplay } from "../components/HashDisplay";
import { api } from "../services/api";
import { DocumentRecord } from "../../../shared/types";
import {
  Upload,
  FilePlus,
  History,
  Layers,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  Eye,
} from "lucide-react";

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // New Document Upload State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Add Version State
  const [activeDocForVersion, setActiveDocForVersion] = useState<DocumentRecord | null>(null);
  const [newVersionContent, setNewVersionContent] = useState("");
  const [submittingVersion, setSubmittingVersion] = useState(false);

  // Version History Modal
  const [historyDoc, setHistoryDoc] = useState<DocumentRecord | null>(null);

  // View Content Modal
  const [viewingContent, setViewingContent] = useState<{ title: string; content: string } | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/documents");
      setDocuments(res.data.documents || []);
    } catch (err: any) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleRegisterDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && !selectedFile) {
      setUploadError("Please provide a title or select a file");
      return;
    }
    if (!content && !selectedFile) {
      setUploadError("Please enter content or select a .txt/.md file");
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      const formData = new FormData();
      formData.append("title", title || (selectedFile ? selectedFile.name : "Policy Document"));
      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("content", content);
      }

      const res = await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadSuccess(
        `Document registered on-chain! Tx: ${res.data.transaction?.txHash?.slice(0, 14)}... in Block #${res.data.transaction?.blockNumber}`
      );
      setTitle("");
      setContent("");
      setSelectedFile(null);
      await fetchDocuments();
    } catch (err: any) {
      setUploadError(err.response?.data?.details || err.response?.data?.error || "Registration failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDocForVersion || !newVersionContent) return;

    try {
      setSubmittingVersion(true);
      await api.post(`/documents/${activeDocForVersion.id}/versions`, {
        content: newVersionContent,
      });

      setActiveDocForVersion(null);
      setNewVersionContent("");
      await fetchDocuments();
    } catch (err: any) {
      alert("Error adding version: " + (err.response?.data?.details || err.message));
    } finally {
      setSubmittingVersion(false);
    }
  };

  const handleViewContent = async (docId: string, version: number, docTitle: string) => {
    try {
      const res = await api.get(`/documents/${docId}/versions/${version}/content`);
      setViewingContent({ title: `${docTitle} (v${version})`, content: res.data.content });
    } catch (err: any) {
      alert("Could not load content: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Document Registry</h2>
        <p className="text-sm text-slate-400">
          Upload and register confidential policies with canonical SHA-256 fingerprinting on-chain
        </p>
      </div>

      {/* Registration Form Card */}
      <Card
        title="Register New Document On-Chain"
        subtitle="Generates unique ID, calculates canonical SHA-256 content hash, and commits to DataLeakLedger"
      >
        {uploadSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}
        {uploadError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleRegisterDocument} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. ConfidentialPolicy.md"
                className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Upload File (.txt or .md)
              </label>
              <input
                type="file"
                accept=".txt,.md"
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Document Text Content
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or type document content here if not uploading a file..."
              className="w-full bg-navy-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? "Mining Transaction..." : "Register On-Chain"}</span>
            </button>
          </div>
        </form>
      </Card>

      {/* Registered Documents Table */}
      <Card
        title={`Registered Documents (${documents.length})`}
        subtitle="Immutable on-chain records with version tracking"
      >
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No documents registered yet. Use the form above to register your first policy.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Canonical SHA-256</th>
                  <th className="py-3 px-4">Registration Tx</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{doc.title}</div>
                      <div className="mt-0.5">
                        <HashDisplay hash={doc.id} truncateLength={5} label="ID" />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="info">v{doc.currentVersion}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <HashDisplay hash={doc.contentHash} truncateLength={6} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <HashDisplay hash={doc.registrationTxHash} truncateLength={5} />
                        <span className="text-[10px] text-slate-400">
                          Block #{doc.registrationBlockNumber}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleViewContent(doc.id, doc.currentVersion, doc.title)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                        title="View Content"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => setHistoryDoc(doc)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                        title="Version History"
                      >
                        <History className="w-3.5 h-3.5 inline mr-1" />
                        <span>History</span>
                      </button>
                      <button
                        onClick={() => setActiveDocForVersion(doc)}
                        className="px-2.5 py-1 rounded bg-brand-600/20 border border-brand-500/30 text-brand-300 hover:bg-brand-600/30 text-[11px] font-medium transition-colors"
                      >
                        <FilePlus className="w-3.5 h-3.5 inline mr-1" />
                        <span>Add Version</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Version Modal */}
      {activeDocForVersion && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-400" />
                <span>Create Version {activeDocForVersion.currentVersion + 1}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Document: <span className="text-slate-200 font-semibold">{activeDocForVersion.title}</span>
              </p>
            </div>

            <form onSubmit={handleAddVersion} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Updated Content
                </label>
                <textarea
                  rows={6}
                  value={newVersionContent}
                  onChange={(e) => setNewVersionContent(e.target.value)}
                  placeholder="Enter the revised document content here..."
                  className="w-full bg-navy-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The previous version will remain fully preserved and immutably referenced on-chain.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveDocForVersion(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVersion}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium disabled:opacity-50"
                >
                  {submittingVersion ? "Mining Version Tx..." : "Commit New Version"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {historyDoc && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  <span>Version History</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{historyDoc.title}</p>
              </div>
              <button
                onClick={() => setHistoryDoc(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historyDoc.versions.map((ver) => (
                <div
                  key={ver.version}
                  className="p-3.5 rounded-lg bg-navy-950 border border-slate-800 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={ver.version === historyDoc.currentVersion ? "primary" : "mono"}>
                        v{ver.version} {ver.version === historyDoc.currentVersion ? "(Latest)" : ""}
                      </Badge>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ver.timestamp * 1000).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewContent(historyDoc.id, ver.version, historyDoc.title)}
                      className="text-brand-400 hover:underline text-[11px]"
                    >
                      View Source
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="text-slate-400 text-[10px]">Content SHA-256: </span>
                      <HashDisplay hash={ver.contentHash} truncateLength={10} />
                    </div>
                    {ver.previousHash && ver.previousHash !== "0x0000000000000000000000000000000000000000000000000000000000000000" && (
                      <div>
                        <span className="text-slate-400 text-[10px]">Previous Version Hash: </span>
                        <HashDisplay hash={ver.previousHash} truncateLength={10} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Viewer Modal */}
      {viewingContent && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                <span>{viewingContent.title}</span>
              </h3>
              <button
                onClick={() => setViewingContent(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-navy-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-96">
              {viewingContent.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
