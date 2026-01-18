// apps/marketplace/src/breeder/pages/CreateProgramWizard.tsx
// Create Animal Program Wizard - 7-step guided experience

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@bhq/ui";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Check,
  FileText,
  DollarSign,
  Settings,
  Sparkles,
  Search,
  X,
} from "lucide-react";

import {
  saveAnimalProgram,
  getTenantAnimals,
  type AnimalProgramCreate,
  type TemplateType,
  type DataDrawerConfig,
  type TenantAnimalItem,
} from "../../api/client";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

type WizardStep = "template" | "basic" | "content" | "pricing" | "animals" | "settings" | "review";

const STEPS: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
  { id: "template", label: "Choose Template", icon: <Sparkles size={16} /> },
  { id: "basic", label: "Basic Info", icon: <FileText size={16} /> },
  { id: "content", label: "Content", icon: <FileText size={16} /> },
  { id: "pricing", label: "Pricing", icon: <DollarSign size={16} /> },
  { id: "animals", label: "Add Animals", icon: <Users size={16} /> },
  { id: "settings", label: "Settings", icon: <Settings size={16} /> },
  { id: "review", label: "Review", icon: <Check size={16} /> },
];

// Note: We intentionally skip localStorage to avoid cross-user contamination
function getTenantId(): string {
  try {
    const w = typeof window !== "undefined" ? (window as any) : {};
    return w.__BHQ_TENANT_ID__ || "";
  } catch {
    return "";
  }
}

const TEMPLATES: {
  type: TemplateType;
  label: string;
  description: string;
  color: string;
  examples: string;
}[] = [
  {
    type: "STUD_SERVICES",
    label: "Stud Services",
    description: "Offer multiple studs for breeding services",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30",
    examples: "Multi-stud programs, champion bloodlines, proven producers",
  },
  {
    type: "GUARDIAN",
    label: "Guardian Program",
    description: "Place breeding animals in guardian homes",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30",
    examples: "Guardian home programs, co-ownership arrangements",
  },
  {
    type: "TRAINED",
    label: "Trained Animals",
    description: "Showcase trained animals for sale or adoption",
    color: "bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30",
    examples: "Service dog programs, working dog sales, trained companions",
  },
  {
    type: "REHOME",
    label: "Rehoming Program",
    description: "Find new homes for retired or young animals",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30",
    examples: "Retired breeder programs, young puppy placements",
  },
  {
    type: "CO_OWNERSHIP",
    label: "Co-Ownership",
    description: "Offer shared ownership arrangements",
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30",
    examples: "Co-owned show prospects, breeding partnerships",
  },
  {
    type: "CUSTOM",
    label: "Custom Program",
    description: "Create a unique program with custom terms",
    color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30 hover:bg-zinc-500/30",
    examples: "Specialty programs, unique offerings",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CreateProgramWizard() {
  const tenantId = getTenantId();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState<WizardStep>("template");
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    templateType: null as TemplateType | null,
    name: "",
    slug: "",
    headline: "",
    description: "",
    defaultPriceModel: "inquire" as "fixed" | "range" | "inquire",
    defaultPriceCents: null as number | null,
    defaultPriceMinCents: null as number | null,
    defaultPriceMaxCents: null as number | null,
    selectedAnimalIds: [] as number[],
    published: false,
    acceptInquiries: true,
    openWaitlist: false,
  });

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const canGoNext = validateStep(currentStep, form);
  const isLastStep = currentStep === "review";

  // Handle Escape key to close wizard
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/manage/animal-programs");
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [navigate]);

  function validateStep(step: WizardStep, data: typeof form): boolean {
    switch (step) {
      case "template":
        return data.templateType !== null;
      case "basic":
        return data.name.trim().length > 0; // Slug auto-generates from name
      case "content":
        return true; // Optional fields
      case "pricing":
        return true; // Optional fields
      case "animals":
        return true; // Can create empty program
      case "settings":
        return true; // All optional
      case "review":
        return true;
      default:
        return false;
    }
  }

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const handleCreate = async () => {
    if (!form.templateType || !form.name.trim()) {
      alert("Please complete required fields");
      return;
    }

    // Ensure slug exists (should be auto-generated, but fallback just in case)
    let slug = form.slug.trim();
    if (!slug) {
      slug = form.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    setSaving(true);
    const input: AnimalProgramCreate = {
      name: form.name.trim(),
      slug: slug,
      templateType: form.templateType,
      headline: form.headline.trim() || undefined,
      description: form.description.trim() || undefined,
      dataDrawerConfig: {} as DataDrawerConfig,
      programContent: {},
      defaultPriceModel: form.defaultPriceModel,
      defaultPriceCents: form.defaultPriceModel === "fixed" ? form.defaultPriceCents : undefined,
      defaultPriceMinCents: form.defaultPriceModel === "range" ? form.defaultPriceMinCents : undefined,
      defaultPriceMaxCents: form.defaultPriceModel === "range" ? form.defaultPriceMaxCents : undefined,
      published: form.published,
      listed: form.published,
      acceptInquiries: form.acceptInquiries,
      openWaitlist: form.openWaitlist,
      selectedAnimalIds: form.selectedAnimalIds.length > 0 ? form.selectedAnimalIds : undefined,
    };

    try {
      console.log("Sending program data:", input);
      const result = await saveAnimalProgram(tenantId, input);
      navigate(`/manage/animal-programs`);
    } catch (err: any) {
      console.error("Create program error:", err);
      console.error("Error message:", err.message);
      console.error("Error status:", err.status);
      const errorMsg = err.message || "Failed to create program";

      // Handle slug conflict - add timestamp and retry
      if (errorMsg.includes("already exists")) {
        const timestamp = Date.now().toString().slice(-6);
        const newSlug = `${slug}-${timestamp}`;

        try {
          const retryInput: AnimalProgramCreate = { ...input, slug: newSlug };
          await saveAnimalProgram(tenantId, retryInput);
          navigate(`/manage/animal-programs`);
          return;
        } catch (retryErr: any) {
          alert(retryErr.message || "Failed to create program");
        }
      } else {
        alert(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

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

  // Handle background click to close wizard
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the background, not on child elements
    if (e.target === e.currentTarget) {
      navigate("/manage/animal-programs");
    }
  };

  return (
    <div
      className="min-h-screen bg-portal-surface cursor-pointer"
      onClick={handleBackgroundClick}
    >
      <div
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <button
                onClick={() => navigate("/manage/animal-programs")}
                className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white mb-4"
              >
                <ArrowLeft size={16} />
                Cancel & Return
              </button>
              <h1 className="text-2xl font-bold text-white">Create Animal Program</h1>
              <p className="text-sm text-text-secondary mt-1">
                Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex].label}
              </p>
            </div>
            <button
              onClick={() => navigate("/manage/animal-programs")}
              className="p-2 text-text-secondary hover:text-white hover:bg-portal-card rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              const isAccessible = index <= currentStepIndex;

              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => isAccessible && setCurrentStep(step.id)}
                    disabled={!isAccessible}
                    className={`flex flex-col items-center gap-2 transition-opacity ${
                      isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isCompleted
                          ? "bg-green-500/20 border-green-500 text-green-400"
                          : isActive
                          ? "bg-accent/20 border-accent text-accent"
                          : "bg-portal-card border-border-subtle text-text-tertiary"
                      }`}
                    >
                      {isCompleted ? <Check size={20} /> : step.icon}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isActive ? "text-white" : isCompleted ? "text-green-400" : "text-text-tertiary"
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-colors ${
                        isCompleted ? "bg-green-500" : "bg-border-subtle"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-portal-card border border-border-subtle rounded-lg p-8 mb-6 min-h-[500px]">
          {currentStep === "template" && (
            <TemplateStep form={form} setForm={setForm} />
          )}
          {currentStep === "basic" && (
            <BasicInfoStep form={form} setForm={setForm} />
          )}
          {currentStep === "content" && (
            <ContentStep form={form} setForm={setForm} />
          )}
          {currentStep === "pricing" && (
            <PricingStep form={form} setForm={setForm} />
          )}
          {currentStep === "animals" && (
            <AnimalsStep form={form} setForm={setForm} />
          )}
          {currentStep === "settings" && (
            <SettingsStep form={form} setForm={setForm} />
          )}
          {currentStep === "review" && (
            <ReviewStep form={form} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {currentStepIndex === 0 ? (
            <Button
              variant="secondary"
              onClick={() => navigate("/manage/animal-programs")}
            >
              <X size={16} className="mr-1.5" />
              Cancel
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={handleBack}
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Back
            </Button>
          )}

          {!isLastStep ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!canGoNext}
            >
              Next
              <ArrowRight size={16} className="ml-1.5" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={saving || !canGoNext}
            >
              {saving ? "Creating..." : "Create Program"}
              <Check size={16} className="ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function TemplateStep({ form, setForm }: { form: any; setForm: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Choose Your Program Template</h2>
      <p className="text-text-secondary mb-6">
        Select the template that best matches your program type. This helps us customize the fields and features.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map((template) => (
          <button
            key={template.type}
            onClick={() => setForm({ ...form, templateType: template.type })}
            className={`text-left p-6 rounded-lg border-2 transition-all ${
              form.templateType === template.type
                ? template.color
                : "bg-portal-surface border-border-subtle hover:border-border-default"
            }`}
          >
            <h3 className="text-lg font-semibold text-white mb-2">{template.label}</h3>
            <p className="text-sm text-text-secondary mb-3">{template.description}</p>
            <p className="text-xs text-text-tertiary italic">
              Examples: {template.examples}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function BasicInfoStep({ form, setForm }: { form: any; setForm: any }) {
  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    setForm({ ...form, name, slug });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Name Your Program</h2>
      <p className="text-text-secondary mb-6">
        Give your program a clear, descriptive name. Your customers will see this on your marketplace.
      </p>

      <div className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Program Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white text-lg"
            placeholder="e.g. Guardian Home Program 2024"
            autoFocus
          />
          <p className="text-xs text-text-tertiary mt-2">
            Choose a name that clearly represents what this program offers
          </p>
        </div>
      </div>
    </div>
  );
}

function ContentStep({ form, setForm }: { form: any; setForm: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Program Content</h2>
      <p className="text-text-secondary mb-6">
        Add a headline and description to help people understand your program.
      </p>

      <div className="space-y-6 max-w-3xl">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Headline (Optional)
          </label>
          <input
            type="text"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            maxLength={120}
            className="w-full px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white"
            placeholder="A catchy one-line summary of your program"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-text-tertiary">
              This appears as the main tagline on your program page
            </p>
            <p className="text-xs text-text-tertiary">
              {form.headline.length}/120
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Description (Optional)
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={5000}
            rows={12}
            className="w-full px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white resize-none font-mono text-sm"
            placeholder="Describe your program in detail. What makes it special? What are the benefits? What should people know?

You can use markdown formatting:
- **bold text**
- *italic text*
- # Headers
- [Links](https://example.com)
- Lists and more"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-text-tertiary">
              Supports Markdown formatting
            </p>
            <p className="text-xs text-text-tertiary">
              {form.description.length}/5000
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingStep({ form, setForm }: { form: any; setForm: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Default Pricing</h2>
      <p className="text-text-secondary mb-6">
        Set a default price model for animals in this program. Individual animals can override this later.
      </p>

      <div className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-white mb-3">Price Model</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setForm({ ...form, defaultPriceModel: "inquire" })}
              className={`px-4 py-6 text-center rounded-lg border-2 transition-all ${
                form.defaultPriceModel === "inquire"
                  ? "bg-blue-500/20 border-blue-500 text-blue-300"
                  : "bg-portal-surface border-border-subtle hover:border-border-default text-text-secondary"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Inquire</div>
              <div className="text-xs">Contact for pricing</div>
            </button>
            <button
              onClick={() => setForm({ ...form, defaultPriceModel: "fixed" })}
              className={`px-4 py-6 text-center rounded-lg border-2 transition-all ${
                form.defaultPriceModel === "fixed"
                  ? "bg-blue-500/20 border-blue-500 text-blue-300"
                  : "bg-portal-surface border-border-subtle hover:border-border-default text-text-secondary"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Fixed</div>
              <div className="text-xs">Set specific price</div>
            </button>
            <button
              onClick={() => setForm({ ...form, defaultPriceModel: "range" })}
              className={`px-4 py-6 text-center rounded-lg border-2 transition-all ${
                form.defaultPriceModel === "range"
                  ? "bg-blue-500/20 border-blue-500 text-blue-300"
                  : "bg-portal-surface border-border-subtle hover:border-border-default text-text-secondary"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Range</div>
              <div className="text-xs">Min - Max price</div>
            </button>
          </div>
        </div>

        {form.defaultPriceModel === "fixed" && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">Price</label>
            <div className="flex items-center gap-2">
              <span className="text-2xl text-text-secondary">$</span>
              <input
                type="number"
                value={form.defaultPriceCents ? form.defaultPriceCents / 100 : ""}
                onChange={(e) =>
                  setForm({ ...form, defaultPriceCents: Math.round(parseFloat(e.target.value || "0") * 100) })
                }
                className="flex-1 px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white text-xl"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>
        )}

        {form.defaultPriceModel === "range" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Minimum Price</label>
              <div className="flex items-center gap-2">
                <span className="text-xl text-text-secondary">$</span>
                <input
                  type="number"
                  value={form.defaultPriceMinCents ? form.defaultPriceMinCents / 100 : ""}
                  onChange={(e) =>
                    setForm({ ...form, defaultPriceMinCents: Math.round(parseFloat(e.target.value || "0") * 100) })
                  }
                  className="flex-1 px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Maximum Price</label>
              <div className="flex items-center gap-2">
                <span className="text-xl text-text-secondary">$</span>
                <input
                  type="number"
                  value={form.defaultPriceMaxCents ? form.defaultPriceMaxCents / 100 : ""}
                  onChange={(e) =>
                    setForm({ ...form, defaultPriceMaxCents: Math.round(parseFloat(e.target.value || "0") * 100) })
                  }
                  className="flex-1 px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnimalsStep({ form, setForm }: { form: any; setForm: any }) {
  const tenantId = getTenantId();
  const [animals, setAnimals] = React.useState<TenantAnimalItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [showDropdown, setShowDropdown] = React.useState(false);

  // Fetch animals on mount and search change
  React.useEffect(() => {
    const fetchAnimals = async () => {
      setLoading(true);
      try {
        const response = await getTenantAnimals(tenantId, {
          search,
          limit: 100,
        });
        setAnimals(response.items || []);
      } catch (err) {
        console.error("Failed to load animals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnimals();
  }, [tenantId, search]);

  const selectedAnimals = React.useMemo(() => {
    return animals.filter((a) => form.selectedAnimalIds.includes(a.id));
  }, [animals, form.selectedAnimalIds]);

  const availableAnimals = React.useMemo(() => {
    let filtered = animals.filter((a) => !form.selectedAnimalIds.includes(a.id));

    // Filter by sex based on template type
    if (form.templateType === "STUD_SERVICES") {
      // Only show males for stud services
      filtered = filtered.filter((a) => a.sex?.toUpperCase() === "MALE" || a.sex?.toUpperCase() === "M");
    }

    return filtered;
  }, [animals, form.selectedAnimalIds, form.templateType]);

  const handleAddAnimal = (animalId: number) => {
    setForm({
      ...form,
      selectedAnimalIds: [...form.selectedAnimalIds, animalId],
    });
    setShowDropdown(false);
    setSearch("");
  };

  const handleRemoveAnimal = (animalId: number) => {
    setForm({
      ...form,
      selectedAnimalIds: form.selectedAnimalIds.filter((id: number) => id !== animalId),
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Add Animals to Program</h2>
      <p className="text-text-secondary mb-6">
        Select which animals are part of this program. You can add more animals later from the program details page.
      </p>

      {form.templateType === "STUD_SERVICES" && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 max-w-2xl">
          <p className="text-sm text-blue-300">
            <strong>Note:</strong> Only male animals are shown for Stud Services programs.
          </p>
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* Add Animal Selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-white mb-2">
            Search and Add Animals
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-10 pr-3 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white"
              placeholder="Search for animals to add..."
            />
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-portal-card border border-border-subtle rounded-lg shadow-2xl max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-text-secondary">
                  Loading animals...
                </div>
              ) : availableAnimals.length === 0 ? (
                <div className="p-4 text-center text-text-secondary">
                  {search ? "No animals found" : form.selectedAnimalIds.length > 0 ? "All animals added" : "No animals available"}
                </div>
              ) : (
                availableAnimals.map((animal) => (
                  <button
                    key={animal.id}
                    onClick={() => handleAddAnimal(animal.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-portal-surface transition-colors text-left border-b border-border-subtle last:border-b-0"
                  >
                    {animal.photoUrl ? (
                      <img
                        src={animal.photoUrl}
                        alt={animal.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-portal-surface flex items-center justify-center">
                        <Users className="w-5 h-5 text-text-tertiary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-white font-medium">{animal.name}</p>
                      <p className="text-sm text-text-tertiary">
                        {[animal.breed, animal.sex].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected Animals List */}
        {selectedAnimals.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-white mb-3">
              Selected Animals ({selectedAnimals.length})
            </h3>
            <div className="space-y-2">
              {selectedAnimals.map((animal) => (
                <div
                  key={animal.id}
                  className="flex items-center gap-3 p-3 bg-portal-surface border border-border-subtle rounded-lg"
                >
                  {animal.photoUrl ? (
                    <img
                      src={animal.photoUrl}
                      alt={animal.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-portal-card flex items-center justify-center">
                      <Users className="w-5 h-5 text-text-tertiary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white font-medium">{animal.name}</p>
                    <p className="text-sm text-text-tertiary">
                      {[animal.breed, animal.sex].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveAnimal(animal.id)}
                    className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedAnimals.length === 0 && (
          <div className="bg-portal-surface border border-border-subtle rounded-lg p-6 text-center">
            <Users className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
            <p className="text-sm text-text-secondary">
              No animals added yet. Search above to add animals to this program.
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              This step is optional - you can add animals later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsStep({ form, setForm }: { form: any; setForm: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Program Settings</h2>
      <p className="text-text-secondary mb-6">
        Configure how your program appears and behaves on your marketplace.
      </p>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-portal-surface border border-border-subtle rounded-lg p-6 space-y-4">
          <label className="flex items-start gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="mt-1 rounded"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-white mb-1">Publish immediately</div>
              <p className="text-xs text-text-secondary">
                Make this program visible to the public right away. If unchecked, it will be saved as a draft.
              </p>
            </div>
          </label>

          <div className="border-t border-border-subtle pt-4">
            <label className="flex items-start gap-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.acceptInquiries}
                onChange={(e) => setForm({ ...form, acceptInquiries: e.target.checked })}
                className="mt-1 rounded"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-white mb-1">Accept inquiries</div>
                <p className="text-xs text-text-secondary">
                  Allow visitors to send inquiries about this program through the contact form.
                </p>
              </div>
            </label>
          </div>

          <div className="border-t border-border-subtle pt-4">
            <label className="flex items-start gap-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.openWaitlist}
                onChange={(e) => setForm({ ...form, openWaitlist: e.target.checked })}
                className="mt-1 rounded"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-white mb-1">Enable waitlist</div>
                <p className="text-xs text-text-secondary">
                  Allow visitors to join a waitlist for this program when no animals are currently available.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ form }: { form: any }) {
  const selectedTemplate = TEMPLATES.find((t) => t.type === form.templateType);

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Review & Create</h2>
      <p className="text-text-secondary mb-6">
        Review your program details before creating. You can edit everything later.
      </p>

      <div className="space-y-6 max-w-3xl">
        <div className="bg-portal-surface border border-border-subtle rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🎯</div>
            <div>
              <h3 className="text-sm font-medium text-text-tertiary">Template</h3>
              <p className="text-lg font-semibold text-white">{selectedTemplate?.label}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-text-tertiary mb-1">Program Name</h3>
              <p className="text-white">{form.name || <span className="text-text-tertiary italic">Not set</span>}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-tertiary mb-1">
                Program URL
              </h3>
              <p className="text-white text-sm font-mono break-all">
                {form.slug || <span className="text-text-tertiary italic">Not set</span>}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                Auto-generated from your program name for web addresses
              </p>
            </div>
          </div>
        </div>

        {(form.headline || form.description) && (
          <div className="bg-portal-surface border border-border-subtle rounded-lg p-6">
            <h3 className="text-sm font-medium text-text-tertiary mb-3">Content</h3>
            {form.headline && (
              <div className="mb-3">
                <p className="text-sm text-text-tertiary mb-1">Headline:</p>
                <p className="text-white">{form.headline}</p>
              </div>
            )}
            {form.description && (
              <div>
                <p className="text-sm text-text-tertiary mb-1">Description:</p>
                <p className="text-white text-sm line-clamp-3">{form.description}</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-portal-surface border border-border-subtle rounded-lg p-6">
          <h3 className="text-sm font-medium text-text-tertiary mb-3">Pricing</h3>
          <p className="text-white">
            {form.defaultPriceModel === "inquire" && "Contact for pricing"}
            {form.defaultPriceModel === "fixed" &&
              `$${(form.defaultPriceCents / 100).toFixed(2)} (fixed)`}
            {form.defaultPriceModel === "range" &&
              `$${(form.defaultPriceMinCents / 100).toFixed(2)} - $${(form.defaultPriceMaxCents / 100).toFixed(2)} (range)`}
          </p>
        </div>

        <div className="bg-portal-surface border border-border-subtle rounded-lg p-6">
          <h3 className="text-sm font-medium text-text-tertiary mb-3">Settings</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Check size={16} className={form.published ? "text-green-400" : "text-text-tertiary"} />
              <span className={form.published ? "text-white" : "text-text-tertiary"}>
                {form.published ? "Will be published immediately" : "Will be saved as draft"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className={form.acceptInquiries ? "text-green-400" : "text-text-tertiary"} />
              <span className={form.acceptInquiries ? "text-white" : "text-text-tertiary"}>
                {form.acceptInquiries ? "Accepting inquiries" : "Not accepting inquiries"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className={form.openWaitlist ? "text-green-400" : "text-text-tertiary"} />
              <span className={form.openWaitlist ? "text-white" : "text-text-tertiary"}>
                {form.openWaitlist ? "Waitlist enabled" : "Waitlist disabled"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateProgramWizard;
