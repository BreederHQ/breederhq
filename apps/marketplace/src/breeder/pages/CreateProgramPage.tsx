// apps/marketplace/src/breeder/pages/CreateProgramPage.tsx
// Create Animal Program Page - Simplified single-page form

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@bhq/ui";
import { ArrowLeft, Users, X } from "lucide-react";

import {
  saveAnimalProgram,
  type AnimalProgramCreate,
  type TemplateType,
  type DataDrawerConfig,
} from "../../api/client";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

function getTenantId(): string {
  try {
    const w = typeof window !== "undefined" ? (window as any) : {};
    return w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID") || "";
  } catch {
    return "";
  }
}

const TEMPLATE_CONFIG: Record<TemplateType, { label: string; color: string }> = {
  STUD_SERVICES: { label: "Stud Services", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  GUARDIAN: { label: "Guardian", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  TRAINED: { label: "Trained", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  REHOME: { label: "Rehome", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  CO_OWNERSHIP: { label: "Co-Ownership", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  CUSTOM: { label: "Custom", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CreateProgramPage() {
  const tenantId = getTenantId();
  const navigate = useNavigate();
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    slug: "",
    templateType: "GUARDIAN" as TemplateType,
    headline: "",
    description: "",
    defaultPriceModel: "inquire",
    defaultPriceCents: null as number | null,
    published: false,
    acceptInquiries: true,
    openWaitlist: false,
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Please enter a program name");
      return;
    }
    if (!form.slug.trim()) {
      alert("Please enter a slug");
      return;
    }

    setSaving(true);
    try {
      const input: AnimalProgramCreate = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        templateType: form.templateType,
        headline: form.headline.trim() || undefined,
        description: form.description.trim() || undefined,
        dataDrawerConfig: {} as DataDrawerConfig, // TODO: implement data drawer
        programContent: {},
        defaultPriceModel: form.defaultPriceModel,
        defaultPriceCents: form.defaultPriceModel === "fixed" ? form.defaultPriceCents : undefined,
        published: form.published,
        listed: form.published,
        acceptInquiries: form.acceptInquiries,
        openWaitlist: form.openWaitlist,
      };

      const result = await saveAnimalProgram(tenantId, input);
      navigate(`/manage/animal-programs/${result.program.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to create program");
    } finally {
      setSaving(false);
    }
  };

  const canSave = form.name.trim().length > 0 && form.slug.trim().length > 0;

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-portal-surface flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <p className="text-text-secondary">No business selected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-portal-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/manage/animal-programs")}
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white mb-4"
          >
            <ArrowLeft size={16} />
            Back to Programs
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Create Animal Program</h1>
              <p className="text-sm text-text-secondary mt-1">
                Set up a new breeding program with multiple animal participants
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-portal-card border border-border-subtle rounded-lg p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Program Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
                  placeholder="e.g. Guardian Home Program 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Slug <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
                  placeholder="guardian-home-2024"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  URL-friendly identifier for this program
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Template Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TEMPLATE_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setForm({ ...form, templateType: key as TemplateType })}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        form.templateType === key
                          ? config.color
                          : "bg-portal-surface border-border-subtle text-text-secondary hover:text-white"
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pt-6 border-t border-border-subtle">
            <h2 className="text-lg font-semibold text-white mb-4">Program Content</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Headline</label>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  maxLength={120}
                  className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
                  placeholder="Eye-catching headline (120 chars)"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  {form.headline.length}/120 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={5000}
                  rows={6}
                  className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white resize-none"
                  placeholder="Describe your program, its goals, and what makes it special..."
                />
                <p className="text-xs text-text-tertiary mt-1">
                  {form.description.length}/5000 characters
                </p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="pt-6 border-t border-border-subtle">
            <h2 className="text-lg font-semibold text-white mb-4">Default Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Price Model</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm({ ...form, defaultPriceModel: "inquire" })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      form.defaultPriceModel === "inquire"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : "bg-portal-surface border-border-subtle text-text-secondary hover:text-white"
                    }`}
                  >
                    Inquire
                  </button>
                  <button
                    onClick={() => setForm({ ...form, defaultPriceModel: "fixed" })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      form.defaultPriceModel === "fixed"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : "bg-portal-surface border-border-subtle text-text-secondary hover:text-white"
                    }`}
                  >
                    Fixed Price
                  </button>
                </div>
              </div>

              {form.defaultPriceModel === "fixed" && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Default Price</label>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary">$</span>
                    <input
                      type="number"
                      value={form.defaultPriceCents ? form.defaultPriceCents / 100 : ""}
                      onChange={(e) =>
                        setForm({ ...form, defaultPriceCents: Math.round(parseFloat(e.target.value || "0") * 100) })
                      }
                      className="flex-1 px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    Individual participants can override this price
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="pt-6 border-t border-border-subtle">
            <h2 className="text-lg font-semibold text-white mb-4">Program Settings</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium text-white">Publish immediately</span>
                  <p className="text-xs text-text-tertiary">Make this program visible to the public</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.acceptInquiries}
                  onChange={(e) => setForm({ ...form, acceptInquiries: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium text-white">Accept inquiries</span>
                  <p className="text-xs text-text-tertiary">Allow visitors to send inquiries about this program</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.openWaitlist}
                  onChange={(e) => setForm({ ...form, openWaitlist: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium text-white">Open waitlist</span>
                  <p className="text-xs text-text-tertiary">Allow visitors to join a waitlist for this program</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => navigate("/manage/animal-programs")} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSave || saving}>
            {saving ? "Creating..." : "Create Program"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CreateProgramPage;
