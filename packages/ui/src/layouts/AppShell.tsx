import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  headerSlot?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
};

export const AppShell: React.FC<Props> = ({
  title,
  subtitle,
  headerSlot,
  sidebar,
  children,
}) => {
  return (
    <div className="min-h-screen bg-background text-foreground bhq-canvas">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-neutral-900 dark:bg-neutral-50" aria-hidden />
            <div>
              <div className="text-sm font-semibold tracking-tight">{title}</div>
              {subtitle ? (
                <div className="text-xs text-neutral-500">{subtitle}</div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">{headerSlot}</div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-12">
        {sidebar ? (
          <aside className="md:col-span-3 lg:col-span-2">
            <div className="bhq-sidebar border border-hairline p-3 rounded-xl">
              {sidebar}
            </div>
          </aside>
        ) : null}

        <main className={sidebar ? "md:col-span-9 lg:col-span-10" : "md:col-span-12"}>
          {children}
        </main>
      </div>
    </div>
  );
};
