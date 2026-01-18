// apps/marketplace/src/breeder/pages/CreateDirectListingWizard.tsx
// Create Individual Animal Listing Wizard - 6-step guided experience for individual animals

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@bhq/ui";
import {
  ArrowLeft,
  ArrowRight,
  Dog,
  Check,
  FileText,
  DollarSign,
  Settings,
  Sparkles,
  Search,
  X,
  MapPin,
} from "lucide-react";

import {
  saveDirectListing,
  getTenantAnimals,
  getAnimalListingData,
  type DirectAnimalListingCreate,
  type TemplateType,
  type DataDrawerConfig,
  type TenantAnimalItem,
  type AnimalListingData,
} from "../../api/client";
import { DataDrawer } from "../components/DataDrawer";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

type WizardStep = "template" | "animal" | "content" | "pricing" | "settings" | "review";

const STEPS: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
  { id: "template", label: "Choose Template", icon: <Sparkles size={16} /> },
  { id: "animal", label: "Select Animal", icon: <Dog size={16} /> },
  { id: "content", label: "Content", icon: <FileText size={16} /> },
  { id: "pricing", label: "Pricing", icon: <DollarSign size={16} /> },
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
    description: "Offer this male for breeding services",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30",
    examples: "Champion studs, proven producers, available for breeding",
  },
  {
    type: "GUARDIAN",
    label: "Guardian Placement",
    description: "Place this animal in a guardian home",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30",
    examples: "Guardian home placement, co-ownership arrangement",
  },
  {
    type: "TRAINED",
    label: "Trained Animal",
    description: "Showcase this trained animal for sale",
    color: "bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30",
    examples: "Service dogs, working dogs, trained companions",
  },
  {
    type: "REHOME",
    label: "Rehoming",
    description: "Find a new home for this animal",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30",
    examples: "Retired breeders, young puppies, pets needing new homes",
  },
  {
    type: "CO_OWNERSHIP",
    label: "Co-Ownership",
    description: "Offer shared ownership of this animal",
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30",
    examples: "Show prospects, breeding partnerships",
  },
  {
    type: "CUSTOM",
    label: "Custom Listing",
    description: "Create a custom listing with your own terms",
    color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30 hover:bg-zinc-500/30",
    examples: "Specialty offerings, unique arrangements",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CreateDirectListingWizard() {
  const tenantId = getTenantId();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState<WizardStep>("template");
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    templateType: null as TemplateType | null,
    animalId: null as number | null,
    selectedAnimal: null as TenantAnimalItem | null,
    slug: "",
    headline: "",
    description: "",
    priceModel: "inquire" as "fixed" | "range" | "inquire",
    priceCents: null as number | null,
    priceMinCents: null as number | null,
    priceMaxCents: null as number | null,
    locationCity: "",
    locationRegion: "",
    published: false,
    listed: true,
    dataDrawerConfig: {} as DataDrawerConfig,
  });

  // Data Drawer state
  const [dataDrawerOpen, setDataDrawerOpen] = React.useState(false);
  const [animalListingData, setAnimalListingData] = React.useState<AnimalListingData | null>(null);
  const [loadingAnimalData, setLoadingAnimalData] = React.useState(false);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const canGoNext = validateStep(currentStep, form);
  const isLastStep = currentStep === "review";

  // Handle Escape key to close wizard
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/manage/individual-animals");
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [navigate]);

  function validateStep(step: WizardStep, data: typeof form): boolean {
    switch (step) {
      case "template":
        return data.templateType !== null;
      case "animal":
        return data.animalId !== null; // Slug auto-generates from animal name
      case "content":
        return true; // Optional fields
      case "pricing":
        return true; // Optional fields
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
    if (!form.templateType || !form.animalId) {
      alert("Please complete required fields");
      return;
    }

    // Ensure slug exists (should be auto-generated, but fallback just in case)
    let slug = form.slug.trim();
    if (!slug && form.selectedAnimal?.name) {
      slug = form.selectedAnimal.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    setSaving(true);
    try {
      const input: DirectAnimalListingCreate = {
        animalId: form.animalId,
        slug: slug,
        templateType: form.templateType,
        status: form.published ? "ACTIVE" : "DRAFT",
        listed: form.listed,
        headline: form.headline.trim() || undefined,
        description: form.description.trim() || undefined,
        priceModel: form.priceModel,
        priceCents: form.priceModel === "fixed" ? form.priceCents : undefined,
        priceMinCents: form.priceModel === "range" ? form.priceMinCents : undefined,
        priceMaxCents: form.priceModel === "range" ? form.priceMaxCents : undefined,
        locationCity: form.locationCity.trim() || undefined,
        locationRegion: form.locationRegion.trim() || undefined,
        dataDrawerConfig: form.dataDrawerConfig,
        listingContent: {},
      };

      console.log("Sending listing data:", input);
      await saveDirectListing(tenantId, input);
      navigate(`/manage/individual-animals`);
    } catch (err: any) {
      console.error("Create listing error:", err);
      const errorMsg = err.message || "Failed to create listing";

      // Handle slug conflict - add timestamp and retry
      if (errorMsg.includes("already exists")) {
        const timestamp = Date.now().toString().slice(-6);
        const newSlug = `${slug}-${timestamp}`;

        try {
          const retryInput: DirectAnimalListingCreate = {
            animalId: form.animalId,
            slug: newSlug,
            templateType: form.templateType,
            status: form.published ? "ACTIVE" : "DRAFT",
            listed: form.listed,
            headline: form.headline.trim() || undefined,
            description: form.description.trim() || undefined,
            priceModel: form.priceModel,
            priceCents: form.priceModel === "fixed" ? form.priceCents : undefined,
            priceMinCents: form.priceModel === "range" ? form.priceMinCents : undefined,
            priceMaxCents: form.priceModel === "range" ? form.priceMaxCents : undefined,
            locationCity: form.locationCity.trim() || undefined,
            locationRegion: form.locationRegion.trim() || undefined,
            dataDrawerConfig: form.dataDrawerConfig,
            listingContent: {},
          };
          await saveDirectListing(tenantId, retryInput);
          navigate(`/manage/individual-animals`);
          return;
        } catch (retryErr: any) {
          alert(retryErr.message || "Failed to create listing");
        }
      } else {
        alert(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle background click to close wizard
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      navigate("/manage/individual-animals");
    }
  };

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-portal-surface flex items-center justify-center">
        <div className="text-center">
          <Dog className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <p className="text-text-secondary">No business selected.</p>
        </div>
      </div>
    );
  }

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
                onClick={() => navigate("/manage/individual-animals")}
                className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white mb-4"
              >
                <ArrowLeft size={16} />
                Cancel & Return
              </button>
              <h1 className="text-2xl font-bold text-white">Create Individual Animal Listing</h1>
              <p className="text-sm text-text-secondary mt-1">
                Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex].label}
              </p>
            </div>
            <button
              onClick={() => navigate("/manage/individual-animals")}
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
          {currentStep === "animal" && (
            <AnimalStep
              form={form}
              setForm={setForm}
              tenantId={tenantId}
              onOpenDataDrawer={async () => {
                if (!form.animalId) return;
                setLoadingAnimalData(true);
                try {
                  const data = await getAnimalListingData(tenantId, form.animalId);
                  setAnimalListingData(data);
                  setDataDrawerOpen(true);
                } catch (err) {
                  console.error("Failed to load animal data:", err);
                  alert("Failed to load animal data. Please try again.");
                } finally {
                  setLoadingAnimalData(false);
                }
              }}
              loadingAnimalData={loadingAnimalData}
            />
          )}
          {currentStep === "content" && (
            <ContentStep form={form} setForm={setForm} />
          )}
          {currentStep === "pricing" && (
            <PricingStep form={form} setForm={setForm} />
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
              onClick={() => navigate("/manage/individual-animals")}
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
              {saving ? "Creating..." : "Create Listing"}
              <Check size={16} className="ml-1.5" />
            </Button>
          )}
        </div>

        {/* Data Drawer */}
        <DataDrawer
          open={dataDrawerOpen}
          onClose={() => setDataDrawerOpen(false)}
          animalData={animalListingData}
          initialConfig={form.dataDrawerConfig}
          onSave={(config) => {
            setForm({ ...form, dataDrawerConfig: config });
            setDataDrawerOpen(false);
          }}
        />
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
      <h2 className="text-xl font-bold text-white mb-2">Choose Your Listing Type</h2>
      <p className="text-text-secondary mb-6">
        Select the type that best describes what you're offering. This helps buyers understand your listing.
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

function AnimalStep({
  form,
  setForm,
  tenantId,
  onOpenDataDrawer,
  loadingAnimalData,
}: {
  form: any;
  setForm: any;
  tenantId: string;
  onOpenDataDrawer: () => void;
  loadingAnimalData: boolean;
}) {
  const [animals, setAnimals] = React.useState<TenantAnimalItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");

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

  // Filter animals based on template type
  const filteredAnimals = React.useMemo(() => {
    let filtered = animals;

    // Filter by sex based on template type
    if (form.templateType === "STUD_SERVICES") {
      filtered = filtered.filter((a) => a.sex?.toUpperCase() === "MALE" || a.sex?.toUpperCase() === "M");
    }

    return filtered;
  }, [animals, form.templateType]);

  const handleSelectAnimal = (animal: TenantAnimalItem) => {
    // Auto-generate slug from animal name
    const slug = animal.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    setForm({
      ...form,
      animalId: animal.id,
      selectedAnimal: animal,
      slug: slug,
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Select an Animal</h2>
      <p className="text-text-secondary mb-6">
        Choose which animal you want to create a listing for.
      </p>

      {form.templateType === "STUD_SERVICES" && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 max-w-2xl">
          <p className="text-sm text-blue-300">
            <strong>Note:</strong> Only male animals are shown for Stud Services listings.
          </p>
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white"
            placeholder="Search for an animal..."
          />
        </div>

        {/* Animal Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-portal-surface rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredAnimals.length === 0 ? (
          <div className="bg-portal-surface border border-border-subtle rounded-lg p-6 text-center">
            <Dog className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
            <p className="text-sm text-text-secondary">
              {search ? "No animals found matching your search" : "No animals available"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
            {filteredAnimals.map((animal) => (
              <button
                key={animal.id}
                onClick={() => handleSelectAnimal(animal)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                  form.animalId === animal.id
                    ? "bg-accent/10 border-accent"
                    : "bg-portal-surface border-border-subtle hover:border-border-default"
                }`}
              >
                {animal.photoUrl ? (
                  <img
                    src={animal.photoUrl}
                    alt={animal.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-portal-card flex items-center justify-center flex-shrink-0">
                    <Dog className="w-6 h-6 text-text-tertiary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{animal.name}</p>
                  <p className="text-sm text-text-tertiary truncate">
                    {[animal.breed, animal.sex].filter(Boolean).join(" • ")}
                  </p>
                </div>
                {form.animalId === animal.id && (
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Customize Data Button */}
        {form.animalId && form.selectedAnimal && (
          <div className="mt-6 pt-6 border-t border-border-subtle">
            <div className="bg-portal-card border border-border-subtle rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-white mb-1">Customize Listing Data</h3>
                  <p className="text-sm text-text-secondary">
                    Select which information about <strong>{form.selectedAnimal.name}</strong> to include in this listing
                    (health testing, genetics, titles, media, etc.)
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onOpenDataDrawer}
                  disabled={loadingAnimalData}
                >
                  {loadingAnimalData ? "Loading..." : "Customize Data"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContentStep({ form, setForm }: { form: any; setForm: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Listing Content</h2>
      <p className="text-text-secondary mb-6">
        Add a headline and description to help buyers understand what you're offering.
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
            placeholder="A catchy one-line summary of your listing"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-text-tertiary">
              This appears as the main tagline on your listing
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
            placeholder="Describe your listing in detail. What makes this animal special? What are the terms?

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
      <h2 className="text-xl font-bold text-white mb-2">Pricing & Location</h2>
      <p className="text-text-secondary mb-6">
        Set your price and optionally add a location for this listing.
      </p>

      <div className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-white mb-3">Price Model</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setForm({ ...form, priceModel: "inquire" })}
              className={`px-4 py-6 text-center rounded-lg border-2 transition-all ${
                form.priceModel === "inquire"
                  ? "bg-blue-500/20 border-blue-500 text-blue-300"
                  : "bg-portal-surface border-border-subtle hover:border-border-default text-text-secondary"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Inquire</div>
              <div className="text-xs">Contact for pricing</div>
            </button>
            <button
              onClick={() => setForm({ ...form, priceModel: "fixed" })}
              className={`px-4 py-6 text-center rounded-lg border-2 transition-all ${
                form.priceModel === "fixed"
                  ? "bg-blue-500/20 border-blue-500 text-blue-300"
                  : "bg-portal-surface border-border-subtle hover:border-border-default text-text-secondary"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Fixed</div>
              <div className="text-xs">Set specific price</div>
            </button>
            <button
              onClick={() => setForm({ ...form, priceModel: "range" })}
              className={`px-4 py-6 text-center rounded-lg border-2 transition-all ${
                form.priceModel === "range"
                  ? "bg-blue-500/20 border-blue-500 text-blue-300"
                  : "bg-portal-surface border-border-subtle hover:border-border-default text-text-secondary"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Range</div>
              <div className="text-xs">Min - Max price</div>
            </button>
          </div>
        </div>

        {form.priceModel === "fixed" && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">Price</label>
            <div className="flex items-center gap-2">
              <span className="text-2xl text-text-secondary">$</span>
              <input
                type="number"
                value={form.priceCents ? form.priceCents / 100 : ""}
                onChange={(e) =>
                  setForm({ ...form, priceCents: Math.round(parseFloat(e.target.value || "0") * 100) })
                }
                className="flex-1 px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white text-xl"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>
        )}

        {form.priceModel === "range" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Minimum Price</label>
              <div className="flex items-center gap-2">
                <span className="text-xl text-text-secondary">$</span>
                <input
                  type="number"
                  value={form.priceMinCents ? form.priceMinCents / 100 : ""}
                  onChange={(e) =>
                    setForm({ ...form, priceMinCents: Math.round(parseFloat(e.target.value || "0") * 100) })
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
                  value={form.priceMaxCents ? form.priceMaxCents / 100 : ""}
                  onChange={(e) =>
                    setForm({ ...form, priceMaxCents: Math.round(parseFloat(e.target.value || "0") * 100) })
                  }
                  className="flex-1 px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        <div className="pt-6 border-t border-border-subtle">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-text-tertiary" />
            <label className="text-sm font-medium text-white">Location (Optional)</label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">City</label>
              <input
                type="text"
                value={form.locationCity}
                onChange={(e) => setForm({ ...form, locationCity: e.target.value })}
                className="w-full px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white"
                placeholder="e.g. Austin"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">State/Region</label>
              <input
                type="text"
                value={form.locationRegion}
                onChange={(e) => setForm({ ...form, locationRegion: e.target.value })}
                className="w-full px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white"
                placeholder="e.g. Texas"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsStep({ form, setForm }: { form: any; setForm: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Listing Settings</h2>
      <p className="text-text-secondary mb-6">
        Configure how your listing appears on the marketplace.
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
                Make this listing visible to the public right away. If unchecked, it will be saved as a draft.
              </p>
            </div>
          </label>
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
        Review your listing details before creating. You can edit everything later.
      </p>

      <div className="space-y-6 max-w-3xl">
        {/* Template & Animal */}
        <div className="bg-portal-surface border border-border-subtle rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            {form.selectedAnimal?.photoUrl ? (
              <img
                src={form.selectedAnimal.photoUrl}
                alt={form.selectedAnimal.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-portal-card flex items-center justify-center">
                <Dog className="w-8 h-8 text-text-tertiary" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">{form.selectedAnimal?.name || "No animal selected"}</h3>
              <p className="text-sm text-text-tertiary">
                {[form.selectedAnimal?.breed, form.selectedAnimal?.sex].filter(Boolean).join(" • ")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-text-tertiary mb-1">Listing Type</h3>
              <p className="text-white">{selectedTemplate?.label || "Not selected"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-tertiary mb-1">Listing URL</h3>
              <p className="text-white text-sm font-mono break-all">
                {form.slug || <span className="text-text-tertiary italic">Not set</span>}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                Auto-generated from animal name for web addresses
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
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

        {/* Pricing */}
        <div className="bg-portal-surface border border-border-subtle rounded-lg p-6">
          <h3 className="text-sm font-medium text-text-tertiary mb-3">Pricing</h3>
          <p className="text-white">
            {form.priceModel === "inquire" && "Contact for pricing"}
            {form.priceModel === "fixed" && form.priceCents &&
              `$${(form.priceCents / 100).toFixed(2)} (fixed)`}
            {form.priceModel === "range" && form.priceMinCents && form.priceMaxCents &&
              `$${(form.priceMinCents / 100).toFixed(2)} - $${(form.priceMaxCents / 100).toFixed(2)} (range)`}
            {form.priceModel === "fixed" && !form.priceCents && "Fixed price (not set)"}
            {form.priceModel === "range" && (!form.priceMinCents || !form.priceMaxCents) && "Price range (not set)"}
          </p>
          {(form.locationCity || form.locationRegion) && (
            <div className="mt-3 pt-3 border-t border-border-subtle">
              <p className="text-sm text-text-tertiary">Location:</p>
              <p className="text-white">{[form.locationCity, form.locationRegion].filter(Boolean).join(", ")}</p>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-portal-surface border border-border-subtle rounded-lg p-6">
          <h3 className="text-sm font-medium text-text-tertiary mb-3">Settings</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Check size={16} className={form.published ? "text-green-400" : "text-text-tertiary"} />
              <span className={form.published ? "text-white" : "text-text-tertiary"}>
                {form.published ? "Will be published immediately" : "Will be saved as draft"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateDirectListingWizard;
