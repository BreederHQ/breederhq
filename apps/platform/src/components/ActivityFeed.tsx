// apps/platform/src/components/dashboard/ActivityFeed.tsx
import * as React from "react";
import type { FeedItem } from "../../api/dashboard";

export default function ActivityFeed({ items }: { items: FeedItem[] }) {
  if (!items?.length) return <div className="p-4 text-sm opacity-70">No recent activity</div>;
  return (
    <div className="p-2">
      <div className="text-lg font-semibold mb-2">Recent activity</div>
      <ul className="space-y-3">
        {items.map(i => (
          <li key={i.id} className="rounded-xl border border-black/5 p-3">
            <div className="text-xs opacity-70">{new Date(i.when).toLocaleString()}</div>
            <div className="text-sm">
              {i.who ? <strong>{i.who}</strong> : null} {i.text}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
