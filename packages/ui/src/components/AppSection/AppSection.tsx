import React from "react";

export function AppSection({ sidebar, children }: { sidebar?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="container mx-auto grid grid-cols-1 gap-6 py-6 md:grid-cols-12">
      {sidebar ? <aside className="md:col-span-3 lg:col-span-2">{sidebar}</aside> : null}
      <main className={sidebar ? "md:col-span-9 lg:col-span-10" : "md:col-span-12"}>{children}</main>
    </div>
  );
}
