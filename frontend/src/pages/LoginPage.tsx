import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ShieldCheck, UserCheck, Lock, ArrowRight, AlertCircle } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, customUser?: string) => {
    if (e) e.preventDefault();
    const userToLogin = customUser || username;
    if (!userToLogin) {
      setError("Please choose or enter a username");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await login(userToLogin, password || "password");
      navigate(userToLogin === "admin" ? "/admin" : "/portal");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Ensure backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 shadow-xl shadow-brand-500/25 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">DataLeak Ledger</h1>
          <p className="text-sm text-slate-400 mt-1">
            Blockchain Audit & Forensic Steganography Platform
          </p>
        </div>

        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-7 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, alice, or bob"
                  className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-brand-600 hover:bg-brand-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Personas */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Viva Demo Personas
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleLogin(undefined, "admin")}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-800/60 transition-all text-center group"
              >
                <div className="text-xs font-semibold text-brand-400 group-hover:text-brand-300">
                  Admin
                </div>
                <div className="text-[10px] text-slate-400">Registrar</div>
              </button>
              <button
                type="button"
                onClick={() => handleLogin(undefined, "alice")}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 transition-all text-center group"
              >
                <div className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                  Alice
                </div>
                <div className="text-[10px] text-slate-400">Authorized</div>
              </button>
              <button
                type="button"
                onClick={() => handleLogin(undefined, "bob")}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/60 transition-all text-center group"
              >
                <div className="text-xs font-semibold text-amber-400 group-hover:text-amber-300">
                  Bob
                </div>
                <div className="text-[10px] text-slate-400">User</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Hardhat Network EVM Chain #31337 • Educational Prototype
        </p>
      </div>
    </div>
  );
};
