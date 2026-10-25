import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface HashDisplayProps {
  hash: string;
  truncateLength?: number;
  label?: string;
  className?: string;
}

export const HashDisplay: React.FC<HashDisplayProps> = ({
  hash,
  truncateLength = 8,
  label,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  if (!hash) return <span className="text-slate-500 font-mono text-xs">-</span>;

  const display =
    hash.length > truncateLength * 2 + 2
      ? `${hash.slice(0, truncateLength + 2)}...${hash.slice(-truncateLength)}`
      : hash;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs group cursor-pointer hover:border-slate-700 hover:text-white transition-colors ${className}`}
      onClick={handleCopy}
      title={`Click to copy: ${hash}`}
    >
      {label && <span className="text-slate-400 font-sans">{label}:</span>}
      <span>{display}</span>
      <button
        type="button"
        className="text-slate-400 group-hover:text-brand-400 transition-colors ml-0.5"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </span>
  );
};
