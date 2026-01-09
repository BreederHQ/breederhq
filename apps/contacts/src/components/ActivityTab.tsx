// apps/contacts/src/components/ActivityTab.tsx
// Unified activity feed showing all interactions with a contact/organization

import * as React from "react";
import { SectionCard } from "@bhq/ui";
import {
  Mail,
  MessageSquare,
  Phone,
  Tag,
  FileText,
  CreditCard,
  UserPlus,
  Calendar,
  Bell,
  Award,
  Edit,
  Archive,
  RotateCcw,
  Link,
  Unlink,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { ActivityItem, ActivityKind } from "@bhq/api";

interface ActivityTabProps {
  partyId: number;
  partyKind: "CONTACT" | "ORGANIZATION";
  api: {
    partyCrm: {
      activity: {
        list: (params: { partyId: number; limit?: number }) => Promise<{ items: ActivityItem[]; total: number }>;
      };
    };
  };
}

const ACTIVITY_ICONS: Record<ActivityKind, React.ReactNode> = {
  note_added: <Edit className="h-4 w-4" />,
  note_updated: <Edit className="h-4 w-4" />,
  email_sent: <Mail className="h-4 w-4" />,
  email_received: <Mail className="h-4 w-4" />,
  message_sent: <MessageSquare className="h-4 w-4" />,
  message_received: <MessageSquare className="h-4 w-4" />,
  call_logged: <Phone className="h-4 w-4" />,
  status_changed: <AlertCircle className="h-4 w-4" />,
  lead_status_changed: <AlertCircle className="h-4 w-4" />,
  tag_added: <Tag className="h-4 w-4" />,
  tag_removed: <Tag className="h-4 w-4" />,
  animal_linked: <Link className="h-4 w-4" />,
  animal_unlinked: <Unlink className="h-4 w-4" />,
  invoice_created: <FileText className="h-4 w-4" />,
  payment_received: <CreditCard className="h-4 w-4" />,
  portal_invited: <UserPlus className="h-4 w-4" />,
  portal_activated: <CheckCircle className="h-4 w-4" />,
  event_created: <Calendar className="h-4 w-4" />,
  event_completed: <CheckCircle className="h-4 w-4" />,
  milestone_reached: <Award className="h-4 w-4" />,
  follow_up_set: <Bell className="h-4 w-4" />,
  follow_up_completed: <CheckCircle className="h-4 w-4" />,
  contact_created: <UserPlus className="h-4 w-4" />,
  contact_updated: <Edit className="h-4 w-4" />,
  contact_archived: <Archive className="h-4 w-4" />,
  contact_restored: <RotateCcw className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<ActivityKind, string> = {
  // Communication - blue
  email_sent: "text-blue-400 bg-blue-500/10",
  email_received: "text-blue-400 bg-blue-500/10",
  message_sent: "text-blue-400 bg-blue-500/10",
  message_received: "text-blue-400 bg-blue-500/10",
  call_logged: "text-blue-400 bg-blue-500/10",
  // Notes - purple
  note_added: "text-purple-400 bg-purple-500/10",
  note_updated: "text-purple-400 bg-purple-500/10",
  // Finance - green
  invoice_created: "text-green-400 bg-green-500/10",
  payment_received: "text-green-400 bg-green-500/10",
  // Events/milestones - orange
  event_created: "text-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/10",
  event_completed: "text-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/10",
  milestone_reached: "text-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/10",
  follow_up_set: "text-amber-400 bg-amber-500/10",
  follow_up_completed: "text-green-400 bg-green-500/10",
  // Status changes - yellow
  status_changed: "text-amber-400 bg-amber-500/10",
  lead_status_changed: "text-amber-400 bg-amber-500/10",
  // Tags - cyan
  tag_added: "text-cyan-400 bg-cyan-500/10",
  tag_removed: "text-cyan-400 bg-cyan-500/10",
  // Relationships - indigo
  animal_linked: "text-indigo-400 bg-indigo-500/10",
  animal_unlinked: "text-indigo-400 bg-indigo-500/10",
  // Portal - teal
  portal_invited: "text-teal-400 bg-teal-500/10",
  portal_activated: "text-teal-400 bg-teal-500/10",
  // System - gray
  contact_created: "text-secondary bg-white/5",
  contact_updated: "text-secondary bg-white/5",
  contact_archived: "text-red-400 bg-red-500/10",
  contact_restored: "text-green-400 bg-green-500/10",
};

export function ActivityTab({ partyId, partyKind, api }: ActivityTabProps) {
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showAll, setShowAll] = React.useState(false);

  const loadActivities = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.partyCrm.activity.list({ partyId, limit: 100 });
      setActivities(res.items);
    } catch (e: any) {
      setError(e?.message || "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [api, partyId]);

  React.useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? "Just now" : `${minutes}m ago`;
      }
      return `${hours}h ago`;
    }
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const displayedActivities = showAll ? activities : activities.slice(0, 20);

  return (
    <div className="space-y-3">
      <SectionCard
        title={
          <span className="inline-flex items-center gap-2">
            <span className="text-lg opacity-70">📊</span>
            <span>Activity</span>
          </span>
        }
      >
        {error && (
          <div className="mb-3 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-secondary">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-sm text-secondary mb-2">No activity yet</div>
            <div className="text-xs text-secondary">
              Activity will appear here as you interact with this {partyKind.toLowerCase()}.
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-3 bottom-3 w-px bg-hairline" />

              <div className="space-y-0">
                {displayedActivities.map((activity, idx) => {
                  const icon = ACTIVITY_ICONS[activity.kind] || <AlertCircle className="h-4 w-4" />;
                  const colorClass = ACTIVITY_COLORS[activity.kind] || "text-secondary bg-white/5";

                  return (
                    <div key={activity.id} className="relative flex items-start gap-3 py-3">
                      {/* Icon */}
                      <div
                        className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}
                      >
                        {icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="text-sm font-medium">{activity.title}</div>
                        {activity.description && (
                          <div className="text-xs text-secondary mt-0.5 line-clamp-2">
                            {activity.description}
                          </div>
                        )}
                        <div className="text-xs text-secondary mt-1 flex items-center gap-2">
                          <span>{formatDate(activity.createdAt)}</span>
                          {activity.createdByUserName && (
                            <>
                              <span className="text-hairline">|</span>
                              <span>{activity.createdByUserName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {activities.length > 20 && !showAll && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="text-sm text-[hsl(var(--brand-orange))] hover:underline"
                >
                  Show all {activities.length} activities
                </button>
              </div>
            )}
          </>
        )}
      </SectionCard>
    </div>
  );
}
