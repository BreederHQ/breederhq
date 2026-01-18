// apps/marketplace/src/breeder/pages/CreateServiceWizard.tsx
// Create Service Listing Wizard - 5-step guided experience for service listings

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@bhq/ui";
import {
  ArrowLeft,
  ArrowRight,
  Wrench,
  Check,
  FileText,
  DollarSign,
  User,
  Sparkles,
  X,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";

import {
  createBreederService,
  type ServiceListingCreateInput,
  type BreederServiceType,
} from "../../api/client";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

type WizardStep = "type" | "details" | "pricing" | "contact" | "review";

const STEPS: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
  { id: "type", label: "Service Type", icon: <Sparkles size={16} /> },
  { id: "details", label: "Details", icon: <FileText size={16} /> },
  { id: "pricing", label: "Pricing", icon: <DollarSign size={16} /> },
  { id: "contact", label: "Contact", icon: <User size={16} /> },
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

const SERVICE_TYPES: {
  type: BreederServiceType;
  label: string;
  description: string;
  color: string;
  examples: string;
}[] = [
  {
    type: "STUD_SERVICE",
    label: "Stud Service",
    description: "Offer breeding services with your male animals",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30",
    examples: "Champion studs, proven producers, breeding contracts",
  },
  {
    type: "TRAINING",
    label: "Training",
    description: "Professional training and behavior services",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30",
    examples: "Obedience, agility, show handling, behavior modification",
  },
  {
    type: "GROOMING",
    label: "Grooming",
    description: "Grooming and coat care services",
    color: "bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/30",
    examples: "Full grooming, breed cuts, bathing, nail trimming",
  },
  {
    type: "TRANSPORT",
    label: "Transport",
    description: "Animal transportation services",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30",
    examples: "Local pickup, long-distance transport, airport delivery",
  },
  {
    type: "BOARDING",
    label: "Boarding",
    description: "Temporary boarding and care services",
    color: "bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30",
    examples: "Overnight stays, extended boarding, daycare",
  },
  {
    type: "OTHER_SERVICE",
    label: "Other Service",
    description: "Other professional services you offer",
    color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30 hover:bg-zinc-500/30",
    examples: "Photography, health testing, microchipping",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CreateServiceWizard() {
  const tenantId = getTenantId();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState<WizardStep>("type");
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    serviceType: null as BreederServiceType | null,
    title: "",
    description: "",
    priceType: "contact" as "contact" | "fixed" | "starting_at",
    priceCents: null as number | null,
    city: "",
    state: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    published: false,
  });

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const canGoNext = validateStep(currentStep, form);
  const isLastStep = currentStep === "review";

  // Handle Escape key to close wizard
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/manage/your-services");
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [navigate]);

  function validateStep(step: WizardStep, data: typeof form): boolean {
    switch (step) {
      case "type":
        return data.serviceType !== null;
      case "details":
        return data.title.trim().length > 0;
      case "pricing":
        return true; // Optional fields
      case "contact":
        return true; // Optional fields
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
    if (!form.serviceType || !form.title.trim()) {
      alert("Please complete required fields");
      return;
    }

    setSaving(true);
    try {
      const input: ServiceListingCreateInput = {
        listingType: form.serviceType,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priceType: form.priceType,
        priceCents: form.priceType !== "contact" ? form.priceCents ?? undefined : undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        contactName: form.contactName.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
      };

      await createBreederService(tenantId, input);
      navigate("/manage/your-services");
    } catch (err: any) {
      console.error("Create service error:", err);
      alert(err.message || "Failed to create service");
    } finally {
      setSaving(false);
    }
  };

  // Handle background click to close wizard
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      navigate("/manage/your-services");
    }
  };

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-portal-surface flex items-center justify-center">
        <div className="text-center">
          <Wrench className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
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
                onClick={() => navigate("/manage/your-services")}
                className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white mb-4"
              >
                <ArrowLeft size={16} />
                Cancel & Return
              </button>
              <h1 className="text-2xl font-bold text-white">Add New Service</h1>
              <p className="text-sm text-text-secondary mt-1">
                Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex].label}
              </p>
            </div>
            <button
              onClick={() => navigate("/manage/your-services")}
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
          {currentStep === "type" && (
            <ServiceTypeStep form={form} setForm={setForm} />
          )}
          {currentStep === "details" && (
            <DetailsStep form={form} setForm={setForm} />
          )}
          {currentStep === "pricing" && (
            <PricingStep form={form} setForm={setForm} />
          )}
          {currentStep === "contact" && (
            <ContactStep form={form} setForm={setForm} />
          )}
          {currentStep === "review" && (
            <ReviewStep form={form} setForm={setForm} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {currentStepIndex === 0 ? (
            <Button
              variant="secondary"
              onClick={() => navigate("/manage/your-services")}
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
              {saving ? "Creating..." : "Create Service"}
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

function ServiceTypeStep({ form, setForm }: { form: any; setForm: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">What type of service do you offer?</h2>
      <p className="text-text-secondary mb-6">
        Select the category that best describes your service. This helps buyers find your listing.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICE_TYPES.map((service) => (
          <button
            key={service.type}
            onClick={() => setForm({ ...form, serviceType: service.type })}
            className={`text-left p-6 rounded-lg border-2 transition-all ${
              form.serviceType === service.type
                ? service.color
                : "bg-portal-surface border-border-subtle hover:border-border-default"
            }`}
          >
            <h3 className="text-lg font-semibold text-white mb-2">{service.label}</h3>
            <p className="text-sm text-text-secondary mb-3">{service.description}</p>
            <p className="text-xs text-text-tertiary italic">
              Examples: {service.examples}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function DetailsStep({ form, setForm }: { form: any; setForm: any }) {
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Auto-focus on title input when step loads
    titleInputRef.current?.focus();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Describe Your Service</h2>
      <p className="text-text-secondary mb-6">
        Give your service a clear title and description to help potential customers understand what you offer.
      </p>

      <div className="space-y-6 max-w-3xl">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Service Title *
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={120}
            className="w-full px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white"
            placeholder="e.g., Professional Dog Training - All Breeds Welcome"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-text-tertiary">
              A clear, descriptive title for your service
            </p>
            <p className="text-xs text-text-tertiary">
              {form.title.length}/120
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
            rows={10}
            className="w-full px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white resize-none"
            placeholder="Describe your service in detail:

• What's included?
• What experience do you have?
• What makes your service special?
• Any requirements or restrictions?"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-text-tertiary">
              Help customers understand exactly what they'll get
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
        Set your pricing model and optionally add your service location.
      </p>

      <div className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-white mb-3">How do you want to display pricing?</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setForm({ ...form, priceType: "contact" })}
              className={`px-4 py-6 text-center rounded-lg border-2 transition-all ${
                form.priceType === "contact"
                  ? "bg-blue-500/20 border-blue-500 text-blue-300"
                  : "bg-portal-surface border-border-subtle hover:border-border-default text-text-secondary"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Contact</div>
              <div className="text-xs">Customers inquire for pricing</div>
            </button>
            <button
              onClick={() => setForm({ ...form, priceType: "fixed" })}
              className={`px-4 py-6 text-center rounded-lg border-2 transition-all ${
                form.priceType === "fixed"
                  ? "bg-blue-500/20 border-blue-500 text-blue-300"
                  : "bg-portal-surface border-border-subtle hover:border-border-default text-text-secondary"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Fixed</div>
              <div className="text-xs">Show a specific price</div>
            </button>
            <button
              onClick={() => setForm({ ...form, priceType: "starting_at" })}
              className={`px-4 py-6 text-center rounded-lg border-2 transition-all ${
                form.priceType === "starting_at"
                  ? "bg-blue-500/20 border-blue-500 text-blue-300"
                  : "bg-portal-surface border-border-subtle hover:border-border-default text-text-secondary"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Starting At</div>
              <div className="text-xs">Show minimum price</div>
            </button>
          </div>
        </div>

        {form.priceType !== "contact" && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {form.priceType === "starting_at" ? "Starting Price" : "Price"}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-2xl text-text-secondary">$</span>
              <input
                type="number"
                value={form.priceCents ? form.priceCents / 100 : ""}
                onChange={(e) =>
                  setForm({ ...form, priceCents: Math.round(parseFloat(e.target.value || "0") * 100) })
                }
                className="flex-1 px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white text-xl"
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        )}

        {/* Location */}
        <div className="pt-6 border-t border-border-subtle">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-text-tertiary" />
            <label className="text-sm font-medium text-white">Service Location (Optional)</label>
          </div>
          <p className="text-sm text-text-tertiary mb-4">
            Adding a location helps local customers find your service.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white"
                placeholder="e.g. Austin"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
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

function ContactStep({ form, setForm }: { form: any; setForm: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Contact Information</h2>
      <p className="text-text-secondary mb-6">
        Add contact details so customers can reach you about this service.
        All fields are optional - leave blank to use your default business contact info.
      </p>

      <div className="space-y-6 max-w-2xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-text-tertiary" />
            <label className="text-sm font-medium text-white">Contact Name</label>
          </div>
          <input
            type="text"
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            className="w-full px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white"
            placeholder="Name to display for inquiries"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-text-tertiary" />
            <label className="text-sm font-medium text-white">Email Address</label>
          </div>
          <input
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            className="w-full px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-text-tertiary" />
            <label className="text-sm font-medium text-white">Phone Number</label>
          </div>
          <input
            type="tel"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            className="w-full px-4 py-3 bg-portal-surface border border-border-subtle rounded-lg text-white"
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
          <p className="text-sm text-blue-300">
            <strong>Tip:</strong> If you leave these fields blank, customers will use your main business
            contact information when reaching out about this service.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ form, setForm }: { form: any; setForm: any }) {
  const selectedType = SERVICE_TYPES.find((t) => t.type === form.serviceType);

  const formatPrice = () => {
    if (form.priceType === "contact") return "Contact for pricing";
    if (!form.priceCents) return form.priceType === "fixed" ? "Fixed price (not set)" : "Starting price (not set)";
    const price = `$${(form.priceCents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    return form.priceType === "starting_at" ? `Starting at ${price}` : price;
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Review & Create</h2>
      <p className="text-text-secondary mb-6">
        Review your service details before creating. You can edit everything later.
      </p>

      <div className="space-y-6 max-w-3xl">
        {/* Service Type & Title */}
        <div className="bg-portal-surface border border-border-subtle rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-portal-card flex items-center justify-center">
              <Wrench className="w-6 h-6 text-text-tertiary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{form.title || "Untitled Service"}</h3>
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${selectedType?.color || "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"}`}>
                {selectedType?.label || "Not selected"}
              </span>
            </div>
          </div>

          {form.description && (
            <div>
              <p className="text-sm text-text-tertiary mb-1">Description:</p>
              <p className="text-white text-sm line-clamp-3">{form.description}</p>
            </div>
          )}
        </div>

        {/* Pricing & Location */}
        <div className="bg-portal-surface border border-border-subtle rounded-lg p-6">
          <h3 className="text-sm font-medium text-text-tertiary mb-3">Pricing & Location</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Price:</p>
              <p className="text-white font-medium">{formatPrice()}</p>
            </div>
            {(form.city || form.state) && (
              <div>
                <p className="text-sm text-text-tertiary mb-1">Location:</p>
                <p className="text-white">{[form.city, form.state].filter(Boolean).join(", ")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        {(form.contactName || form.contactEmail || form.contactPhone) && (
          <div className="bg-portal-surface border border-border-subtle rounded-lg p-6">
            <h3 className="text-sm font-medium text-text-tertiary mb-3">Contact Information</h3>
            <div className="space-y-2 text-sm">
              {form.contactName && (
                <div className="flex items-center gap-2">
                  <User size={14} className="text-text-tertiary" />
                  <span className="text-white">{form.contactName}</span>
                </div>
              )}
              {form.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-text-tertiary" />
                  <span className="text-white">{form.contactEmail}</span>
                </div>
              )}
              {form.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-text-tertiary" />
                  <span className="text-white">{form.contactPhone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="bg-portal-surface border border-border-subtle rounded-lg p-6">
          <h3 className="text-sm font-medium text-text-tertiary mb-3">Settings</h3>
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
                Make this service visible to the public right away. If unchecked, it will be saved as a draft.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

export default CreateServiceWizard;
