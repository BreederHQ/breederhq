// apps/breeding/src/components/PostFoalingHeatTracker.tsx
// Component to track post-foaling heat cycles and breeding readiness for mares

import * as React from "react";
import {
  Heart,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Activity,
  Baby,
} from "lucide-react";
import { Button, DatePicker } from "@bhq/ui";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PostFoalingHeatData {
  planId: number;
  mareName: string;
  mareId: number;
  birthDate: string;
  postFoalingHeatDate: string | null;
  postFoalingHeatNotes: string | null;
  readyForRebreeding: boolean;
  rebredDate: string | null;
  avgPostFoalingHeatDays?: number | null; // From mare history
  expectedHeatDateMin?: string | null; // Calculated: birthDate + 5 days (foal heat)
  expectedHeatDateMax?: string | null; // Calculated: birthDate + 12 days
}

export interface PostFoalingHeatTrackerProps {
  /** List of mares with recent foalings */
  mares: PostFoalingHeatData[];
  /** Whether data is loading */
  loading?: boolean;
  /** Callback when heat date is recorded */
  onRecordHeat?: (planId: number, heatDate: string, notes?: string) => Promise<void>;
  /** Callback when ready for rebreeding is toggled */
  onToggleReadyForRebreeding?: (planId: number, ready: boolean) => Promise<void>;
  /** Callback when rebred date is recorded */
  onRecordRebred?: (planId: number, rebredDate: string) => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateDaysSinceBirth(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  return Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getHeatStatus(
  daysSinceBirth: number,
  heatDate: string | null
): { status: "waiting" | "expected" | "overdue" | "recorded"; label: string; color: string } {
  if (heatDate) {
    return { status: "recorded", label: "Heat Recorded", color: "text-emerald-400" };
  }
  if (daysSinceBirth < 5) {
    return { status: "waiting", label: `${5 - daysSinceBirth}d until expected`, color: "text-secondary" };
  }
  if (daysSinceBirth <= 12) {
    return { status: "expected", label: "Foal heat window", color: "text-orange-400" };
  }
  return { status: "overdue", label: `${daysSinceBirth - 12}d past window`, color: "text-amber-400" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARE ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function MareRow({
  mare,
  onRecordHeat,
  onToggleReadyForRebreeding,
  onRecordRebred,
}: {
  mare: PostFoalingHeatData;
  onRecordHeat?: PostFoalingHeatTrackerProps["onRecordHeat"];
  onToggleReadyForRebreeding?: PostFoalingHeatTrackerProps["onToggleReadyForRebreeding"];
  onRecordRebred?: PostFoalingHeatTrackerProps["onRecordRebred"];
}) {
  const [showHeatForm, setShowHeatForm] = React.useState(false);
  const [showRebredForm, setShowRebredForm] = React.useState(false);
  const [heatDate, setHeatDate] = React.useState("");
  const [heatNotes, setHeatNotes] = React.useState("");
  const [rebredDate, setRebredDate] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const daysSinceBirth = calculateDaysSinceBirth(mare.birthDate);
  const heatStatus = getHeatStatus(daysSinceBirth, mare.postFoalingHeatDate);

  const handleRecordHeat = async () => {
    if (!heatDate || !onRecordHeat) return;
    setIsSubmitting(true);
    try {
      await onRecordHeat(mare.planId, heatDate, heatNotes || undefined);
      setShowHeatForm(false);
      setHeatDate("");
      setHeatNotes("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordRebred = async () => {
    if (!rebredDate || !onRecordRebred) return;
    setIsSubmitting(true);
    try {
      await onRecordRebred(mare.planId, rebredDate);
      setShowRebredForm(false);
      setRebredDate("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleReady = async () => {
    if (!onToggleReadyForRebreeding) return;
    setIsSubmitting(true);
    try {
      await onToggleReadyForRebreeding(mare.planId, !mare.readyForRebreeding);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
    "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))]";

  return (
    <div className="border border-hairline rounded-xl overflow-hidden">
      {/* Main Row */}
      <div className="p-4 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-4">
          {/* Mare Info */}
          <div>
            <div className="font-medium text-white">{mare.mareName}</div>
            <div className="text-xs text-secondary">
              Foaled {formatDate(mare.birthDate)} ({daysSinceBirth} days ago)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Heat Status Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            heatStatus.status === "recorded" ? "bg-emerald-500/15 text-emerald-400" :
            heatStatus.status === "expected" ? "bg-orange-500/15 text-orange-400" :
            heatStatus.status === "overdue" ? "bg-amber-500/15 text-amber-400" :
            "bg-white/5 text-secondary"
          }`}>
            {heatStatus.label}
          </div>

          {/* Ready for Rebreeding Toggle */}
          {mare.postFoalingHeatDate && !mare.rebredDate && (
            <button
              onClick={handleToggleReady}
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mare.readyForRebreeding
                  ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                  : "bg-white/5 text-secondary hover:bg-white/10"
              }`}
            >
              {mare.readyForRebreeding ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {mare.readyForRebreeding ? "Ready to Breed" : "Mark Ready"}
            </button>
          )}

          {/* Rebred Status */}
          {mare.rebredDate && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-medium">
              <Heart className="w-3.5 h-3.5" />
              Rebred {formatDate(mare.rebredDate)}
            </div>
          )}

          {/* Action Buttons */}
          {!mare.postFoalingHeatDate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHeatForm(!showHeatForm)}
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Record Heat
            </Button>
          )}
          {mare.postFoalingHeatDate && mare.readyForRebreeding && !mare.rebredDate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRebredForm(!showRebredForm)}
            >
              <Heart className="w-3.5 h-3.5 mr-1.5" />
              Record Breeding
            </Button>
          )}
        </div>
      </div>

      {/* Heat Recording Form */}
      {showHeatForm && (
        <div className="p-4 border-t border-hairline bg-surface/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-secondary mb-1.5 block">Heat Date</label>
              <DatePicker
                value={heatDate}
                onChange={(e) => setHeatDate(e.currentTarget.value)}
                inputClassName={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-secondary mb-1.5 block">Notes (optional)</label>
              <input
                type="text"
                value={heatNotes}
                onChange={(e) => setHeatNotes(e.target.value)}
                placeholder="Any observations about the heat cycle..."
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowHeatForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRecordHeat}
              disabled={!heatDate || isSubmitting}
            >
              Save Heat Record
            </Button>
          </div>
        </div>
      )}

      {/* Rebred Recording Form */}
      {showRebredForm && (
        <div className="p-4 border-t border-hairline bg-surface/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-secondary mb-1.5 block">Breeding Date</label>
              <DatePicker
                value={rebredDate}
                onChange={(e) => setRebredDate(e.currentTarget.value)}
                inputClassName={inputClass}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowRebredForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRecordRebred}
              disabled={!rebredDate || isSubmitting}
            >
              Record Breeding
            </Button>
          </div>
        </div>
      )}

      {/* Mare History Info */}
      {mare.avgPostFoalingHeatDays && (
        <div className="px-4 py-2 border-t border-hairline bg-white/3 text-xs text-secondary flex items-center gap-2">
          <Activity className="w-3 h-3" />
          Historical avg: {Math.round(mare.avgPostFoalingHeatDays)} days post-foaling
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function PostFoalingHeatTracker({
  mares,
  loading = false,
  onRecordHeat,
  onToggleReadyForRebreeding,
  onRecordRebred,
}: PostFoalingHeatTrackerProps) {
  // Filter mares by status
  const pendingMares = mares.filter((m) => !m.postFoalingHeatDate);
  const recordedMares = mares.filter((m) => m.postFoalingHeatDate && !m.rebredDate);
  const completedMares = mares.filter((m) => m.rebredDate);

  if (loading) {
    return (
      <div className="bg-portal-card border border-hairline rounded-xl p-6">
        <div className="h-6 w-48 bg-white/5 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (mares.length === 0) {
    return (
      <div className="bg-portal-card border border-hairline rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-5 h-5 text-pink-400" />
          <h3 className="text-lg font-semibold text-white">Post-Foaling Heat Tracker</h3>
        </div>
        <div className="text-center py-8">
          <Baby className="w-12 h-12 mx-auto text-secondary/30 mb-3" />
          <p className="text-secondary">No recent foalings to track</p>
          <p className="text-xs text-secondary/70 mt-1">
            Mares will appear here after foaling is recorded
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-portal-card border border-hairline rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-hairline">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/15">
            <Heart className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Post-Foaling Heat Tracker</h3>
            <p className="text-xs text-secondary">
              {pendingMares.length} awaiting heat, {recordedMares.length} ready for rebreeding
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Pending Heat Section */}
        {pendingMares.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">
                Awaiting Foal Heat ({pendingMares.length})
              </span>
            </div>
            <div className="space-y-3">
              {pendingMares.map((mare) => (
                <MareRow
                  key={mare.planId}
                  mare={mare}
                  onRecordHeat={onRecordHeat}
                  onToggleReadyForRebreeding={onToggleReadyForRebreeding}
                  onRecordRebred={onRecordRebred}
                />
              ))}
            </div>
          </div>
        )}

        {/* Ready for Rebreeding Section */}
        {recordedMares.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                Heat Recorded ({recordedMares.length})
              </span>
            </div>
            <div className="space-y-3">
              {recordedMares.map((mare) => (
                <MareRow
                  key={mare.planId}
                  mare={mare}
                  onRecordHeat={onRecordHeat}
                  onToggleReadyForRebreeding={onToggleReadyForRebreeding}
                  onRecordRebred={onRecordRebred}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Section */}
        {completedMares.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">
                Rebred ({completedMares.length})
              </span>
            </div>
            <div className="space-y-3">
              {completedMares.map((mare) => (
                <MareRow
                  key={mare.planId}
                  mare={mare}
                  onRecordHeat={onRecordHeat}
                  onToggleReadyForRebreeding={onToggleReadyForRebreeding}
                  onRecordRebred={onRecordRebred}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostFoalingHeatTracker;
