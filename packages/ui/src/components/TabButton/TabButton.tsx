import * as React from "react";

export type TabButtonProps = {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  title?: string;
};

export function TabButton({ active, children, onClick, className = "", disabled, title }: TabButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        "px-2 py-1 rounded text-sm",
        active ? "bg-[hsl(var(--brand-orange))] text-black" : "border border-hairline text-primary hover:bg-[hsl(var(--brand-orange))]/12",
        disabled ? "opacity-60 cursor-not-allowed" : "",
        className
      ].join(" ")}
    >
      {children}
    </button>
  );
}
