import * as React from "react";

export type SectionCardProps = {
  title: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({ title, right, children, className = "" }: SectionCardProps) {
  return (
    <div className={["rounded-xl border border-hairline bg-surface p-3", className].join(" ")}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wide text-secondary">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}
