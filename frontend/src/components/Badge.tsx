import React from "react";

export type BadgeVariant = "success" | "danger" | "warning" | "info" | "primary" | "mono";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "primary", className = "" }) => {
  const styles: Record<BadgeVariant, string> = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    info: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    primary: "bg-brand-500/10 text-brand-400 border-brand-500/30",
    mono: "bg-slate-800 text-slate-300 border-slate-700 font-mono text-xs",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
