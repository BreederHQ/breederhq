import React from "react";
import { AppShell, SidebarNav, PageHeader, Card } from "@bhq/ui";
import { api } from "./api";
import type { UiOffspringGroup, UiOffspring } from "@bhq/api";
import { offspringRoutes, type Route } from "./routes";
import "@bhq/ui/styles/table.css";


function useHashPath(defaultPath: string) {
  const [path, setPath] = React.useState(() => location.hash.slice(1) || defaultPath);
  React.useEffect(() => {
    const onHash = () => setPath(location.hash.slice(1) || defaultPath);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [defaultPath]);
  const navigate = (to: string) => { location.hash = to; };
  return { path, navigate };
}

function OffspringPage() {
  const [groups, setGroups] = React.useState<UiOffspringGroup[]>([]);
  const [selected, setSelected] = React.useState<UiOffspringGroup | null>(null);
  const [kids, setKids] = React.useState<UiOffspring[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);

    api.offspring
      .listGroups()
      .then(g => {
        if (!alive) return;
        setGroups(g);
        if (g.length) setSelected(g[0]);
      })
      .catch(e => { if (alive) setError(e as Error); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, []);

  React.useEffect(() => {
    if (!selected) return;
    setKids([]);
    api.offspring.listByGroup(selected.id).then(setKids).catch(console.error);
  }, [selected?.id]);

  return (
    <div className="p-6 space-y-4">
      <PageHeader title="Offspring" subtitle="Manage litters/kittens/foals" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bhq-glass bhq-shadow-stack p-0">
          <div className="p-3 text-xs text-neutral-400 border-b border-white/10">Groups</div>
          {loading ? <div className="p-6 text-sm text-neutral-400">Loading…</div>
            : error ? <div className="p-6 text-sm text-red-400">Error: {error.message}</div>
              : (
                <ul className="divide-y divide-white/10">
                  {groups.map(g => (
                    <li key={g.id} onClick={() => setSelected(g)}
                      className={`p-3 cursor-pointer hover:bg-white/5 ${selected?.id === g.id ? "bg-white/10" : ""}`}>
                      <div className="text-sm font-medium">{g.litter_name ?? g.id}</div>
                      <div className="text-xs text-neutral-400">
                        {g.species}{g.breed ? ` • ${g.breed}` : ""} • {g.count} offspring
                      </div>
                      <div className="text-xs text-neutral-400">
                        {g.invoice_rollup ? `Invoices: ${g.invoice_rollup.latestStatus ?? "—"}` : "No invoices"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
        </Card>

        <Card className="lg:col-span-2 bhq-glass bhq-shadow-stack p-0">
          <div className="p-3 text-xs text-neutral-400 border-b border-white/10">
            {selected ? (selected.litter_name ?? selected.id) : "Select a group"}
          </div>
          {!selected ? <div className="p-6 text-sm text-neutral-400">No group selected</div>
            : (
              <table className="u-table-dense w-full">
                <thead>
                  <tr className="text-left text-xs text-neutral-400">
                    <th className="py-2 px-3">Name/ID</th>
                    <th className="py-2 px-3">Sex</th>
                    <th className="py-2 px-3">Color</th>
                    <th className="py-2 px-3">Buyer</th>
                    <th className="py-2 px-3">Invoice</th>
                    <th className="py-2 px-3">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {kids.map(k => (
                    <tr key={k.id} className="border-t border-white/10">
                      <td className="py-2 px-3">{k.name ?? k.id}</td>
                      <td className="py-2 px-3">{k.sex ?? "—"}</td>
                      <td className="py-2 px-3">{k.color ?? "—"}</td>
                      <td className="py-2 px-3">{k.buyer_contact_id ?? "—"}</td>
                      <td className="py-2 px-3">—</td>
                      <td className="py-2 px-3">{(k as any).balance_cents != null ? `$${((k as any).balance_cents / 100).toFixed(2)}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </Card>
      </div>
    </div>
  );
}

export default function AppOffspring() {
  const pages = { OffspringPage: <OffspringPage /> };
  const routes = offspringRoutes(pages);
  const { path, navigate } = useHashPath("/offspring");
  const current = routes.find(r => r.path === path) ?? routes[0];

  return (
    <AppShell
      sidebar={<SidebarNav items={routes.map(r => ({ label: r.label, href: `#${r.path}`, onClick: () => navigate(r.path) }))} />}
      content={current.element}
    />
  );
}
