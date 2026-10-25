import React from "react";

interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  glow?: "blue" | "cyan" | "none";
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = "",
  glow = "none",
}) => {
  const glowClass = glow === "blue" ? "glow-blue" : glow === "cyan" ? "glow-cyan" : "";

  return (
    <div
      className={`bg-navy-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl ${glowClass} ${className}`}
    >
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};
