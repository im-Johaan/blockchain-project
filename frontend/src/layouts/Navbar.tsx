import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { HashDisplay } from "../components/HashDisplay";
import { Badge } from "../components/Badge";
import { ShieldCheck, LogOut, Radio, User as UserIcon } from "lucide-react";
import { api } from "../services/api";

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [networkInfo, setNetworkInfo] = useState<{ blockNumber: number; chainId: number } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get("/blockchain/status");
        setNetworkInfo({ blockNumber: res.data.blockNumber, chainId: res.data.chainId });
      } catch (err) {
        // Node not reachable yet or loading
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-navy-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            DataLeak Ledger
            <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
              EVM v1.0
            </span>
          </h1>
          <p className="text-[11px] text-slate-400">Blockchain Audit & Forensic Steganography</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Network indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400">Hardhat Local</span>
          {networkInfo && (
            <span className="font-mono text-emerald-400">#{networkInfo.blockNumber}</span>
          )}
        </div>

        {/* User Badge */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200">{user.username}</span>
                <Badge variant={isAdmin ? "primary" : "info"}>
                  {user.role.toUpperCase()}
                </Badge>
              </div>
              <HashDisplay hash={user.address} truncateLength={4} />
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
