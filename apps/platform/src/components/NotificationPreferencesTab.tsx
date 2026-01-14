// apps/platform/src/components/NotificationPreferencesTab.tsx
import React, { useState, useEffect } from "react";
import { Button, SectionCard } from "@bhq/ui";

interface NotificationPreferences {
  vaccinationExpiring: boolean;
  vaccinationOverdue: boolean;
  breedingTimeline: boolean;
  pregnancyCheck: boolean;
  foalingApproaching: boolean;
  heatCycleExpected: boolean;
  marketplaceInquiry: boolean;
  waitlistSignup: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  vaccinationExpiring: true,
  vaccinationOverdue: true,
  breedingTimeline: true,
  pregnancyCheck: true,
  foalingApproaching: true,
  heatCycleExpected: true,
  marketplaceInquiry: true,
  waitlistSignup: true,
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: false,
};

interface NotificationPreferencesTabProps {
  onDirty?: (dirty: boolean) => void;
}

export function NotificationPreferencesTab({ onDirty }: NotificationPreferencesTabProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if preferences have changed
  const isDirty = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);

  useEffect(() => {
    onDirty?.(isDirty);
  }, [isDirty, onDirty]);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    setLoading(true);
    setError(null);

    try {
      const tenantId = (window as any).__BHQ_TENANT_ID__;
      if (!tenantId) {
        throw new Error("Tenant ID not found");
      }

      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
      const res = await fetch("/api/v1/notifications/preferences", {
        credentials: "include",
        headers: {
          "x-tenant-id": String(tenantId),
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load notification preferences");
      }

      const data = await res.json();
      const prefs = data.preferences || DEFAULT_PREFERENCES;
      setPreferences(prefs);
      setOriginalPreferences(prefs);
    } catch (err: any) {
      setError(err.message || "Failed to load preferences");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const tenantId = (window as any).__BHQ_TENANT_ID__;
      if (!tenantId) {
        throw new Error("Tenant ID not found");
      }

      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
      const res = await fetch("/api/v1/notifications/preferences", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": String(tenantId),
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
        body: JSON.stringify(preferences),
      });

      if (!res.ok) {
        throw new Error("Failed to save notification preferences");
      }

      const data = await res.json();
      const savedPrefs = data.preferences || preferences;
      setPreferences(savedPrefs);
      setOriginalPreferences(savedPrefs);
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setPreferences(originalPreferences);
    setError(null);
    setSuccess(false);
  }

  function updatePreference(key: keyof NotificationPreferences, value: boolean) {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(false);
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading notification preferences...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Control which notifications you receive and how you receive them.
        </p>
      </div>

      {/* Delivery Methods */}
      <SectionCard title="Delivery Methods" icon="🔔">
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-strong cursor-pointer">
            <div>
              <div className="font-medium">Email Notifications</div>
              <div className="text-xs text-muted-foreground">
                Receive notifications via email
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailEnabled}
              onChange={(e) => updatePreference("emailEnabled", e.target.checked)}
              className="w-5 h-5 rounded border-hairline"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-strong cursor-pointer opacity-50">
            <div>
              <div className="font-medium">SMS Notifications</div>
              <div className="text-xs text-muted-foreground">
                Receive notifications via text message (Coming soon)
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.smsEnabled}
              disabled
              className="w-5 h-5 rounded border-hairline"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-strong cursor-pointer opacity-50">
            <div>
              <div className="font-medium">Push Notifications</div>
              <div className="text-xs text-muted-foreground">
                Receive browser push notifications (Coming soon)
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.pushEnabled}
              disabled
              className="w-5 h-5 rounded border-hairline"
            />
          </label>
        </div>
      </SectionCard>

      {/* Health Notifications */}
      <SectionCard title="Health Notifications" icon="💉">
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-strong cursor-pointer">
            <div>
              <div className="font-medium">Vaccination Expiring</div>
              <div className="text-xs text-muted-foreground">
                Alert me 7, 3, and 1 day before vaccinations expire
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.vaccinationExpiring}
              onChange={(e) => updatePreference("vaccinationExpiring", e.target.checked)}
              className="w-5 h-5 rounded border-hairline"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-strong cursor-pointer">
            <div>
              <div className="font-medium">Vaccination Overdue</div>
              <div className="text-xs text-muted-foreground">
                Alert me when vaccinations are overdue
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.vaccinationOverdue}
              onChange={(e) => updatePreference("vaccinationOverdue", e.target.checked)}
              className="w-5 h-5 rounded border-hairline"
            />
          </label>
        </div>
      </SectionCard>

      {/* Breeding Notifications */}
      <SectionCard title="Breeding Notifications" icon="🐴">
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-strong cursor-pointer">
            <div>
              <div className="font-medium">Breeding Timeline</div>
              <div className="text-xs text-muted-foreground">
                Alert me for heat cycle, hormone testing, and breeding windows
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.breedingTimeline}
              onChange={(e) => updatePreference("breedingTimeline", e.target.checked)}
              className="w-5 h-5 rounded border-hairline"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-strong cursor-pointer">
            <div>
              <div className="font-medium">Heat Cycle Expected</div>
              <div className="text-xs text-muted-foreground">
                Alert me when a mare's heat cycle is approaching
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.heatCycleExpected}
              onChange={(e) => updatePreference("heatCycleExpected", e.target.checked)}
              className="w-5 h-5 rounded border-hairline"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-strong cursor-pointer">
            <div>
              <div className="font-medium">Pregnancy Check</div>
              <div className="text-xs text-muted-foreground">
                Alert me when pregnancy checks are due
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.pregnancyCheck}
              onChange={(e) => updatePreference("pregnancyCheck", e.target.checked)}
              className="w-5 h-5 rounded border-hairline"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-strong cursor-pointer">
            <div>
              <div className="font-medium">Foaling Approaching</div>
              <div className="text-xs text-muted-foreground">
                Alert me 30, 14, 7, 3, and 1 day before expected foaling date
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.foalingApproaching}
              onChange={(e) => updatePreference("foalingApproaching", e.target.checked)}
              className="w-5 h-5 rounded border-hairline"
            />
          </label>
        </div>
      </SectionCard>

      {/* Marketplace Notifications */}
      <SectionCard title="Marketplace Notifications" icon="🛒">
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-strong cursor-pointer">
            <div>
              <div className="font-medium">Marketplace Inquiry</div>
              <div className="text-xs text-muted-foreground">
                Alert me when someone inquires about my listings
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.marketplaceInquiry}
              onChange={(e) => updatePreference("marketplaceInquiry", e.target.checked)}
              className="w-5 h-5 rounded border-hairline"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-strong cursor-pointer">
            <div>
              <div className="font-medium">Waitlist Signup</div>
              <div className="text-xs text-muted-foreground">
                Alert me when someone joins my waitlist
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.waitlistSignup}
              onChange={(e) => updatePreference("waitlistSignup", e.target.checked)}
              className="w-5 h-5 rounded border-hairline"
            />
          </label>
        </div>
      </SectionCard>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
          Notification preferences saved successfully!
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-hairline">
        <Button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="px-6"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </Button>

        {isDirty && (
          <Button
            onClick={handleReset}
            variant="secondary"
            disabled={saving}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export default NotificationPreferencesTab;
