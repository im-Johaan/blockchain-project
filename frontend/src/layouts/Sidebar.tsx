import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  LayoutDashboard,
  FileText,
  KeyRound,
  DownloadCloud,
  SearchCode,
  Blocks,
  History,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();

  const navItems = [
    ...(isAdmin
      ? [
          { to: "/admin", icon: LayoutDashboard, label: "Admin Dashboard" },
          { to: "/documents", icon: FileText, label: "Document Registry" },
          { to: "/access", icon: KeyRound, label: "Access Control" },
        ]
      : []),
    { to: "/portal", icon: DownloadCloud, label: "Document Portal" },
    ...(isAdmin
      ? [{ to: "/forensics", icon: SearchCode, label: "Forensic Analysis" }]
      : []),
    { to: "/explorer", icon: Blocks, label: "Blockchain Explorer" },
    { to: "/audit", icon: History, label: "Audit Timeline" },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-navy-900/50 flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-600/20 text-brand-400 border border-brand-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="p-3 rounded-lg bg-navy-950/80 border border-slate-800/80 text-xs text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300 flex items-center justify-between">
          <span>Smart Contract</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </div>
        <p className="text-[11px] text-slate-400">Solidity 0.8.24</p>
        <p className="text-[10px] text-slate-400 font-mono">SHA-256 + Keccak-256</p>
      </div>
    </aside>
  );
};
