import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export const PageHeader: React.FC<Props> = ({ title, subtitle, actions }) => {
  return (
    <div className="mb-4 flex flex-col items-start justify-between gap-3 md:mb-6 md:flex-row md:items-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
};
