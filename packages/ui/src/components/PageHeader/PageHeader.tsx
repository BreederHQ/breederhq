// packages/ui/src/components/PageHeader/PageHeader.tsx
import React from "react";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
};

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, className }) => {
  return (
    <div className={`mb-4 flex flex-col items-start justify-between gap-3 md:mb-6 md:flex-row md:items-center ${className ?? ""}`}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-neutral-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
};

PageHeader.displayName = "PageHeader";

export { PageHeader };     // named export
export default PageHeader; // default export
