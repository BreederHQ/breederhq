import * as React from "react";

// Backward-compatible props: accept legacy `rightSlot` as well as `actions`.
export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  rightSlot?: React.ReactNode; // ← legacy alias, keeps older apps working
  className?: string;
};

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  rightSlot,
  className,
}) => {
  // prefer new prop, fall back to legacy
  const slot = actions ?? rightSlot ?? null;

  return (
    <div className={`mb-4 md:mb-6 ${className ?? ""}`}>
      {/* single row, aligned, with visible overflow so buttons are never clipped */}
      <div className="relative flex min-h-[40px] items-center">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-neutral-500 truncate">{subtitle}</p>
          ) : null}
        </div>

        {slot ? (
          <div
            className="ml-3 flex items-center gap-2 shrink-0"
            style={{ overflow: "visible" }}
          >
            {slot}
          </div>
        ) : null}
      </div>
    </div>
  );
};

PageHeader.displayName = "PageHeader";

export { PageHeader };     // named export
export default PageHeader; // default export
