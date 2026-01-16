// apps/marketplace/src/breeder/pages/ProgramDetailPage.tsx
// Animal Program Detail & Edit Page - Tabbed interface with participant management

import * as React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button, Badge } from "@bhq/ui";
import {
  ArrowLeft,
  Users,
  Edit,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  FileText,
  DollarSign,
  Image,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
  Globe,
  Lock,
} from "lucide-react";

import {
  getAnimalProgram,
  saveAnimalProgram,
  addProgramParticipant,
  removeProgramParticipant,
  type AnimalProgram,
  type AnimalProgramCreate,
  type TemplateType,
  type DataDrawerConfig,
} from "../../api/client";

import logoUrl from "@bhq/ui/assets/logo.png";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & HELPERS
// ═══════════════════════════════════════════════════════════════════════════

type TabId = "overview" | "content" | "media" | "pricing" | "participants" | "preview";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Eye size={16} /> },
  { id: "content", label: "Content", icon: <FileText size={16} /> },
  { id: "media", label: "Media", icon: <Image size={16} /> },
  { id: "pricing", label: "Pricing", icon: <DollarSign size={16} /> },
  { id: "participants", label: "Animals", icon: <Users size={16} /> },
  { id: "preview", label: "Preview", icon: <EyeOff size={16} /> },
];

function getTenantId(): string {
  try {
    const w = typeof window !== "undefined" ? (window as any) : {};
    return w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID") || "";
  } catch {
    return "";
  }
}

const TEMPLATE_CONFIG: Record<TemplateType, { label: string; color: string }> = {
  STUD_SERVICES: { label: "Stud", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  GUARDIAN: { label: "Guardian", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  TRAINED: { label: "Trained", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  REHOME: { label: "Rehome", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  CO_OWNERSHIP: { label: "Co-Own", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  CUSTOM: { label: "Custom", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ProgramDetailPage() {
  const { programId } = useParams<{ programId: string }>();
  const tenantId = getTenantId();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we should start in edit mode (from URL param)
  const searchParams = new URLSearchParams(location.search);
  const startInEditMode = searchParams.get("edit") === "true";

  console.log("ProgramDetailPage - location.search:", location.search);
  console.log("ProgramDetailPage - startInEditMode:", startInEditMode);

  const [program, setProgram] = React.useState<AnimalProgram | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabId>("overview");
  const [editing, setEditing] = React.useState(startInEditMode);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    slug: "",
    headline: "",
    description: "",
    coverImageUrl: "",
    defaultPriceModel: "inquire",
    defaultPriceCents: null as number | null,
    defaultPriceMinCents: null as number | null,
    defaultPriceMaxCents: null as number | null,
    published: false,
    acceptInquiries: true,
    openWaitlist: false,
  });

  const fetchProgram = React.useCallback(async () => {
    if (!programId || !tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAnimalProgram(tenantId, parseInt(programId));
      setProgram(data);
      setForm({
        name: data.name,
        slug: data.slug,
        headline: data.headline || "",
        description: data.description || "",
        coverImageUrl: data.coverImageUrl || "",
        defaultPriceModel: data.defaultPriceModel,
        defaultPriceCents: data.defaultPriceCents,
        defaultPriceMinCents: data.defaultPriceMinCents,
        defaultPriceMaxCents: data.defaultPriceMaxCents,
        published: data.published,
        acceptInquiries: data.acceptInquiries,
        openWaitlist: data.openWaitlist,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load program");
    } finally {
      setLoading(false);
    }
  }, [programId, tenantId]);

  React.useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  const handleSave = async (overrides?: Partial<typeof form>) => {
    if (!program) return;
    setSaving(true);
    try {
      // Merge form with any overrides
      const formData = { ...form, ...overrides };

      const input: AnimalProgramCreate = {
        id: program.id,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        templateType: program.templateType,
        headline: formData.headline.trim() || undefined,
        description: formData.description.trim() || undefined,
        coverImageUrl: formData.coverImageUrl.trim() || undefined,
        dataDrawerConfig: program.dataDrawerConfig,
        programContent: program.programContent || {},
        defaultPriceModel: formData.defaultPriceModel,
        defaultPriceCents: formData.defaultPriceModel === "fixed" ? formData.defaultPriceCents : undefined,
        defaultPriceMinCents: formData.defaultPriceModel === "range" ? formData.defaultPriceMinCents : undefined,
        defaultPriceMaxCents: formData.defaultPriceModel === "range" ? formData.defaultPriceMaxCents : undefined,
        published: formData.published,
        listed: formData.published,
        acceptInquiries: formData.acceptInquiries,
        openWaitlist: formData.openWaitlist,
      };

      await saveAnimalProgram(tenantId, input);
      setEditing(false);
      fetchProgram();
    } catch (err: any) {
      alert(err.message || "Failed to save program");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-portal-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary">Loading program...</p>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="min-h-screen bg-portal-surface flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <p className="text-red-400 mb-4">{error || "Program not found"}</p>
          <Button variant="secondary" onClick={() => navigate("/manage/animal-programs")}>
            Back to Programs
          </Button>
        </div>
      </div>
    );
  }

  const templateConfig = TEMPLATE_CONFIG[program.templateType];

  return (
    <>
      <div className="min-h-screen bg-portal-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/manage/animal-programs")}
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white mb-4"
            >
              <ArrowLeft size={16} />
              Back to Programs
            </button>

            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${templateConfig.color}`}>
                    {templateConfig.label}
                  </span>
                  <Badge variant={program.published ? "success" : "neutral"}>
                    {program.published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold text-white">{program.name}</h1>
                {program.headline && (
                  <p className="text-sm text-text-secondary mt-1">{program.headline}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="primary" onClick={() => setEditing(true)}>
                  <Edit size={16} className="mr-1.5" />
                  Edit Program
                </Button>
              </div>
            </div>
          </div>

        {/* Tabs */}
        <div className="border-b border-border-subtle mb-6">
          <div className="flex items-center gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-accent text-white"
                    : "border-transparent text-text-secondary hover:text-white"
                }`}
              >
                {tab.icon}
                <span className="text-sm font-medium">{tab.label}</span>
                {tab.id === "participants" && (
                  <span className="text-xs bg-portal-card px-1.5 py-0.5 rounded">
                    {program.participants.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && (
            <OverviewTab program={program} form={form} setForm={setForm} editing={editing} handleSave={handleSave} />
          )}
          {activeTab === "content" && (
            <ContentTab program={program} form={form} setForm={setForm} editing={editing} />
          )}
          {activeTab === "media" && (
            <MediaTab program={program} form={form} setForm={setForm} editing={editing} />
          )}
          {activeTab === "pricing" && (
            <PricingTab program={program} form={form} setForm={setForm} editing={editing} />
          )}
          {activeTab === "participants" && (
            <ParticipantsTab program={program} tenantId={tenantId} onUpdate={fetchProgram} />
          )}
          {activeTab === "preview" && (
            <PreviewTab program={program} form={form} />
          )}
        </div>
      </div>
    </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditing(false)}
          />

          {/* Modal */}
          <div className="relative bg-portal-card border border-border-subtle rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col my-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div>
                <h2 className="text-xl font-bold text-white">Edit Program</h2>
                <p className="text-sm text-text-secondary mt-0.5">{program.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  <Save size={16} className="mr-1.5" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Tabs */}
              <div className="border-b border-border-subtle mb-6">
                <div className="flex items-center gap-6 overflow-x-auto">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-3 border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-accent text-white"
                          : "border-transparent text-text-secondary hover:text-white"
                      }`}
                    >
                      {tab.icon}
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div>
                {activeTab === "overview" && (
                  <OverviewTab program={program} form={form} setForm={setForm} editing={editing} />
                )}
                {activeTab === "content" && (
                  <ContentTab program={program} form={form} setForm={setForm} editing={editing} />
                )}
                {activeTab === "media" && (
                  <MediaTab program={program} form={form} setForm={setForm} editing={editing} />
                )}
                {activeTab === "pricing" && (
                  <PricingTab program={program} form={form} setForm={setForm} editing={editing} />
                )}
                {activeTab === "participants" && (
                  <ParticipantsTab program={program} tenantId={tenantId} onUpdate={fetchProgram} />
                )}
                {activeTab === "preview" && (
                  <PreviewTab program={program} form={form} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function OverviewTab({ program, form, setForm, editing, handleSave }: any) {
  const activeParticipants = program.participants.filter((p) => p.listed).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-portal-card border border-border-subtle rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{program.participants.length}</p>
          <p className="text-sm text-text-tertiary">Total Animals</p>
        </div>
        <div className="bg-portal-card border border-border-subtle rounded-lg p-4">
          <p className="text-2xl font-bold text-green-400">{activeParticipants}</p>
          <p className="text-sm text-text-tertiary">Active Listings</p>
        </div>
        <div className="bg-portal-card border border-border-subtle rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-400">{program.viewCount}</p>
          <p className="text-sm text-text-tertiary">Total Views</p>
        </div>
      </div>

      {/* Visibility Settings */}
      <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Visibility</h3>
          {!editing && (
            <Button
              variant={form.published ? "secondary" : "primary"}
              onClick={async () => {
                const newPublished = !form.published;
                setForm({ ...form, published: newPublished });
                // Auto-save with the new published state
                await handleSave({ published: newPublished });
              }}
            >
              {form.published ? (
                <>
                  <Lock size={16} className="mr-1.5" />
                  Unpublish
                </>
              ) : (
                <>
                  <Globe size={16} className="mr-1.5" />
                  Publish Program
                </>
              )}
            </Button>
          )}
        </div>
        <div className="space-y-4">
          {editing ? (
            <>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="mt-1 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-white">Published</div>
                  <p className="text-xs text-text-secondary">Make this program visible to the public</p>
                </div>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.acceptInquiries}
                  onChange={(e) => setForm({ ...form, acceptInquiries: e.target.checked })}
                  className="mt-1 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-white">Accept Inquiries</div>
                  <p className="text-xs text-text-secondary">Allow visitors to send inquiries</p>
                </div>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.openWaitlist}
                  onChange={(e) => setForm({ ...form, openWaitlist: e.target.checked })}
                  className="mt-1 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-white">Open Waitlist</div>
                  <p className="text-xs text-text-secondary">Enable waitlist for this program</p>
                </div>
              </label>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Published</span>
                </div>
                <button
                  onClick={async () => {
                    const newValue = !form.published;
                    setForm({ ...form, published: newValue });
                    await handleSave({ published: newValue });
                  }}
                  className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
                >
                  {form.published ? (
                    <>
                      <Globe size={16} className="text-green-400" />
                      <span className="text-green-400">Public</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} className="text-text-tertiary" />
                      <span className="text-text-tertiary">Unlisted</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Accept Inquiries</span>
                </div>
                <button
                  onClick={async () => {
                    const newValue = !form.acceptInquiries;
                    setForm({ ...form, acceptInquiries: newValue });
                    await handleSave({ acceptInquiries: newValue });
                  }}
                  className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
                >
                  {form.acceptInquiries ? (
                    <>
                      <CheckCircle size={16} className="text-green-400" />
                      <span className="text-green-400">Enabled</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-text-tertiary" />
                      <span className="text-text-tertiary">Disabled</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Open Waitlist</span>
                </div>
                <button
                  onClick={async () => {
                    const newValue = !form.openWaitlist;
                    setForm({ ...form, openWaitlist: newValue });
                    await handleSave({ openWaitlist: newValue });
                  }}
                  className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
                >
                  {form.openWaitlist ? (
                    <>
                      <CheckCircle size={16} className="text-green-400" />
                      <span className="text-green-400">Enabled</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-text-tertiary" />
                      <span className="text-text-tertiary">Disabled</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {program.description && (
        <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
          <div className="text-text-secondary whitespace-pre-wrap">{program.description}</div>
        </div>
      )}
    </div>
  );
}

function ContentTab({ program, form, setForm, editing }: any) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Program Content</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Program Name</label>
            {editing ? (
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
              />
            ) : (
              <p className="text-text-secondary">{program.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Headline</label>
            {editing ? (
              <input
                type="text"
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                maxLength={120}
                className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
              />
            ) : (
              <p className="text-text-secondary">{program.headline || "No headline set"}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Description</label>
            {editing ? (
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={8}
                maxLength={5000}
                className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white resize-none"
              />
            ) : (
              <p className="text-text-secondary whitespace-pre-wrap">{program.description || "No description set"}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaTab({ program, form, setForm, editing }: any) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Program Media</h3>
        <p className="text-sm text-text-secondary mb-6">
          Add images and branding to make your program stand out in marketplace listings
        </p>

        <div className="space-y-6">
          {/* Cover Image Preview */}
          {form.coverImageUrl && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">Preview</label>
              <div className="relative w-full aspect-video bg-portal-surface rounded-lg overflow-hidden border border-border-subtle">
                <img
                  src={form.coverImageUrl}
                  alt="Program cover"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement!.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center">
                        <div class="text-center">
                          <div class="w-16 h-16 mx-auto mb-2 rounded-lg bg-portal-card border border-border-subtle flex items-center justify-center">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-tertiary"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                          </div>
                          <p class="text-sm text-red-400">Failed to load image</p>
                        </div>
                      </div>
                    `;
                  }}
                />
              </div>
            </div>
          )}

          {/* Cover Image URL */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Cover Image URL</label>
            <p className="text-xs text-text-tertiary mb-3">
              This image appears in program cards and at the top of your program page
            </p>

            {/* Image Specifications */}
            <div className="mb-3 p-3 bg-portal-surface border border-border-subtle rounded-lg">
              <h4 className="text-xs font-semibold text-white mb-2">Image Requirements</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Aspect Ratio:</span>
                  <span className="text-white font-medium">4:3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Recommended:</span>
                  <span className="text-white font-medium">1200×900px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Format:</span>
                  <span className="text-white font-medium">JPG, PNG, WebP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Max Size:</span>
                  <span className="text-white font-medium">2 MB</span>
                </div>
              </div>
            </div>

            {editing ? (
              <div className="space-y-2">
                <input
                  type="url"
                  value={form.coverImageUrl}
                  onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white placeholder-text-tertiary"
                />
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <Upload size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-300">
                    <p className="font-medium mb-1">Upload coming soon</p>
                    <p className="text-blue-400/80">For now, paste the URL of an image hosted elsewhere (e.g., Cloudinary, AWS S3, Imgur)</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-text-secondary break-all">{program.coverImageUrl || "No cover image set"}</p>
            )}
          </div>

          {/* Empty state when no image */}
          {!form.coverImageUrl && editing && (
            <div className="border-2 border-dashed border-border-subtle rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-portal-card border border-border-subtle flex items-center justify-center">
                <Image size={32} className="text-text-tertiary" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">No cover image</h4>
              <p className="text-xs text-text-secondary mb-4">
                Add a cover image to make your program more appealing to potential customers
              </p>
            </div>
          )}

          {/* Gallery placeholder for future */}
          <div className="pt-4 border-t border-border-subtle">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-white">Gallery</h4>
                <p className="text-xs text-text-tertiary">Additional images for your program</p>
              </div>
              <Badge variant="neutral">Coming Soon</Badge>
            </div>
            <div className="grid grid-cols-4 gap-3 opacity-50 pointer-events-none">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-portal-surface border border-border-subtle rounded-lg flex items-center justify-center">
                  <Image size={20} className="text-text-tertiary" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingTab({ program, form, setForm, editing }: any) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Default Pricing</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Price Model</label>
            {editing ? (
              <div className="flex gap-2">
                {["inquire", "fixed", "range"].map((model) => (
                  <button
                    key={model}
                    onClick={() => setForm({ ...form, defaultPriceModel: model })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      form.defaultPriceModel === model
                        ? "bg-blue-500/20 border-blue-500 text-blue-300"
                        : "bg-portal-surface border-border-subtle text-text-secondary"
                    }`}
                  >
                    {model.charAt(0).toUpperCase() + model.slice(1)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary capitalize">{program.defaultPriceModel}</p>
            )}
          </div>

          {form.defaultPriceModel === "fixed" && editing && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">Price</label>
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">$</span>
                <input
                  type="number"
                  value={form.defaultPriceCents ? form.defaultPriceCents / 100 : ""}
                  onChange={(e) =>
                    setForm({ ...form, defaultPriceCents: Math.round(parseFloat(e.target.value || "0") * 100) })
                  }
                  className="flex-1 px-3 py-2 bg-portal-surface border border-border-subtle rounded-lg text-white"
                  step="0.01"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ParticipantsTab({ program, tenantId, onUpdate }: { program: AnimalProgram; tenantId: string; onUpdate: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Program Animals</h3>
          <p className="text-sm text-text-secondary">Manage animals participating in this program</p>
        </div>
        <Button variant="primary" disabled>
          <Plus size={16} className="mr-1.5" />
          Add Animal
        </Button>
      </div>

      {program.participants.length === 0 ? (
        <div className="bg-portal-card border border-border-subtle rounded-lg p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">No animals yet</h4>
          <p className="text-sm text-text-secondary mb-4">
            Add animals to this program to start showcasing them together
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {program.participants.map((participant) => (
            <div
              key={participant.id}
              className="bg-portal-card border border-border-subtle rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {participant.animal.photoUrl ? (
                    <img
                      src={participant.animal.photoUrl}
                      alt={participant.animal.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-portal-surface flex items-center justify-center">
                      <Users size={20} className="text-text-tertiary" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-white">{participant.animal.name}</h4>
                    <p className="text-xs text-text-tertiary">
                      {participant.animal.breed} • {participant.animal.sex}
                    </p>
                  </div>
                </div>
                <Badge variant={participant.listed ? "success" : "neutral"}>
                  {participant.listed ? "Active" : "Hidden"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewTab({ program, form }: { program: AnimalProgram; form: any }) {
  const templateConfig = TEMPLATE_CONFIG[program.templateType];

  // Use form values if in edit mode, otherwise use program values
  const displayName = form.name || program.name;
  const displayHeadline = form.headline || program.headline;
  const displayDescription = form.description || program.description;
  const displayCoverImage = form.coverImageUrl || program.coverImageUrl;
  const displayPrice = form.defaultPriceModel === "fixed" && form.defaultPriceCents
    ? `$${(form.defaultPriceCents / 100).toLocaleString()}`
    : form.defaultPriceModel === "range" && form.defaultPriceMinCents && form.defaultPriceMaxCents
    ? `$${(form.defaultPriceMinCents / 100).toLocaleString()} - $${(form.defaultPriceMaxCents / 100).toLocaleString()}`
    : "Inquire for pricing";

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-300 mb-1">Marketplace Preview</h4>
            <p className="text-sm text-blue-400/80">
              This is exactly how your program will appear in the marketplace listing when published.
              Changes made in edit mode will update this preview in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div className="bg-portal-surface rounded-lg p-8">
        <div className="max-w-md mx-auto">
          {/* Service Card - Matches marketplace design */}
          <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all">
            {/* Cover Image */}
            <div className="relative w-full aspect-[4/3] bg-[#0f0f0f]">
              {displayCoverImage ? (
                <img
                  src={displayCoverImage}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0d0d0d] via-[#1a1a1a] to-[#0a0a0a] relative overflow-hidden">
                  {/* Subtle warm glow - purple/magenta to complement orange */}
                  <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.06) 0%, transparent 65%)'
                  }}></div>
                  {/* Very subtle accent hints - teal and purple */}
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 25% 30%, rgba(20, 184, 166, 0.04) 0%, transparent 45%), radial-gradient(circle at 75% 70%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)'
                  }}></div>
                  {/* Logo */}
                  <div className="relative z-10 flex items-center justify-center">
                    <img src={logoUrl} alt="BreederHQ" className="h-44 w-auto" />
                  </div>
                </div>
              )}

              {/* Template Badge */}
              <div className="absolute top-3 left-3">
                <span className={`px-2 py-1 text-xs font-medium rounded ${templateConfig.color}`}>
                  {templateConfig.label}
                </span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 space-y-3">
              {/* Title */}
              <h3 className="text-lg font-bold text-white line-clamp-2">
                {displayName}
              </h3>

              {/* Headline/Description */}
              <p className="text-sm text-[#a0a0a0] line-clamp-2">
                {displayHeadline || displayDescription || "No description provided"}
              </p>

              {/* Provider Info */}
              <div className="flex items-center gap-2 text-xs text-[#808080]">
                <Users size={14} />
                <span>{program.participants.length} {program.participants.length === 1 ? "animal" : "animals"}</span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a]">
                <div>
                  <span className="text-lg font-bold text-[#ff6b35]">
                    {displayPrice}
                  </span>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-white bg-transparent border border-[#3a3a3a] rounded hover:bg-[#2a2a2a] transition-colors">
                  View provider
                </button>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between p-3 bg-portal-card border border-border-subtle rounded-lg">
              <span className="text-sm text-text-secondary">Visibility Status</span>
              <Badge variant={form.published ? "success" : "neutral"}>
                {form.published ? "Published" : "Draft"}
              </Badge>
            </div>

            {!displayCoverImage && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-300">
                  <p className="font-medium">No cover image</p>
                  <p className="text-amber-400/80 mt-0.5">Add a cover image in the Media tab to make your listing more appealing</p>
                </div>
              </div>
            )}

            {program.participants.length === 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-300">
                  <p className="font-medium">No animals added</p>
                  <p className="text-amber-400/80 mt-0.5">Add animals in the Animals tab to complete your program</p>
                </div>
              </div>
            )}

            {!displayHeadline && !displayDescription && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-300">
                  <p className="font-medium">Missing description</p>
                  <p className="text-amber-400/80 mt-0.5">Add a headline or description in the Content tab to help customers understand your program</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgramDetailPage;
