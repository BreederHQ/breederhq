// apps/platform/src/components/MarketplaceSettingsTab.tsx
import React from "react";
import { Button, SectionCard, Badge, Card, Input } from "@bhq/ui";

/* ─────────────────────────────────────────────────────────────────────────────
   MarketplaceSettingsTab - Breeder Marketplace Profile Settings

   Static UI scaffold for tenant-level marketplace profile management.
   No backend wiring yet - all data is placeholder/static.
───────────────────────────────────────────────────────────────────────────── */

type MarketplaceSettingsTabProps = {
  dirty: boolean;
  onDirty: (v: boolean) => void;
};

// ─── Shared Input Styling ───────────────────────────────────────────────────
const INPUT_CLS = "w-full bg-card border border-hairline rounded-md px-3 h-10 text-sm placeholder:text-secondary outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]";
const TEXTAREA_CLS = "w-full bg-card border border-hairline rounded-md px-3 py-2 text-sm placeholder:text-secondary outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))] resize-none";
const LABEL_CLS = "block text-sm font-medium text-primary mb-1";
const SUBLABEL_CLS = "text-xs text-secondary mb-2";

// ─── Toggle Component ───────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <label className={["inline-flex items-center gap-2 cursor-pointer", disabled ? "opacity-50 cursor-not-allowed" : ""].join(" ")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={[
          "relative w-10 h-5 rounded-full transition-colors",
          checked ? "bg-[hsl(var(--brand-orange))]" : "bg-surface-strong border border-hairline",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
      {label && <span className="text-sm text-secondary">{label}</span>}
    </label>
  );
}

// ─── Checkbox Component ─────────────────────────────────────────────────────
function Checkbox({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={["flex items-center gap-2 cursor-pointer", disabled ? "opacity-50 cursor-not-allowed" : ""].join(" ")}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-hairline bg-card accent-[hsl(var(--brand-orange))]"
      />
      <span className="text-sm text-primary">{label}</span>
    </label>
  );
}

// ─── Radio Group Component ──────────────────────────────────────────────────
function RadioGroup({ value, onChange, options, name }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; name: string }) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-4 h-4 border-hairline bg-card accent-[hsl(var(--brand-orange))]"
          />
          <span className="text-sm text-primary">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Species Chip Component ─────────────────────────────────────────────────
function SpeciesChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
        selected
          ? "bg-[hsl(var(--brand-orange))] text-white border-transparent"
          : "bg-surface-strong text-secondary border-hairline hover:border-[hsl(var(--brand-orange))]/50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

// ─── Program Card Component ─────────────────────────────────────────────────
function ProgramCard({
  name,
  description,
  status,
  availability,
  onToggle,
}: {
  name: string;
  description: string;
  status: boolean;
  availability: string;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-primary">{name}</h4>
          <p className="text-sm text-secondary mt-1 line-clamp-2">{description}</p>
        </div>
        <Toggle checked={status} onChange={onToggle} label="Listed in Marketplace" />
      </div>
      <div className="flex items-center gap-2 text-xs">
        <Badge variant={status ? "green" : "neutral"}>
          {status ? "Listed" : "Hidden"}
        </Badge>
        <Badge variant="neutral">{availability}</Badge>
      </div>
      <button type="button" className="text-xs text-[hsl(var(--brand-orange))] hover:underline">
        Preview listing →
      </button>
    </div>
  );
}

// ─── Credentials Checklist Section ──────────────────────────────────────────
function CredentialsChecklist({
  title,
  items,
  selected,
  onToggle,
  noteValue,
  onNoteChange,
  noteMaxLength = 200,
}: {
  title: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  noteValue: string;
  onNoteChange: (v: string) => void;
  noteMaxLength?: number;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-primary">{title}</h4>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <Checkbox
            key={item}
            checked={selected.includes(item)}
            onChange={() => onToggle(item)}
            label={item}
          />
        ))}
      </div>
      <div>
        <textarea
          value={noteValue}
          onChange={(e) => onNoteChange(e.target.value.slice(0, noteMaxLength))}
          placeholder="Optional notes..."
          rows={2}
          className={TEXTAREA_CLS}
        />
        <div className="text-xs text-secondary text-right mt-1">
          {noteValue.length}/{noteMaxLength}
        </div>
      </div>
    </div>
  );
}

// ─── Marketplace Preview Card ───────────────────────────────────────────────
function MarketplacePreviewCard({
  businessName,
  locationDisplay,
  breeds,
}: {
  businessName: string;
  locationDisplay: string;
  breeds: string[];
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-hairline bg-surface-strong/50 p-4 max-w-sm">
      <div className="text-xs text-secondary uppercase tracking-wide mb-3">Preview</div>
      <div className="flex gap-4">
        {/* Logo placeholder */}
        <div className="w-16 h-16 rounded-lg bg-card border border-hairline flex items-center justify-center text-2xl text-secondary shrink-0">
          🐾
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-primary truncate">{businessName || "Your Business Name"}</h4>
          <p className="text-sm text-secondary">{locationDisplay || "Location hidden"}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {breeds.length > 0 ? (
              breeds.slice(0, 3).map((b) => (
                <span key={b} className="text-xs bg-surface-strong px-2 py-0.5 rounded-full border border-hairline">
                  {b}
                </span>
              ))
            ) : (
              <span className="text-xs text-secondary italic">No breeds selected</span>
            )}
            {breeds.length > 3 && (
              <span className="text-xs text-secondary">+{breeds.length - 3} more</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Validation Warning ─────────────────────────────────────────────────────
function ValidationWarning({ message, type = "warning" }: { message: string; type?: "warning" | "error" | "info" }) {
  const colors = {
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    error: "bg-red-500/10 border-red-500/30 text-red-300",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-300",
  };
  return (
    <div className={["text-sm rounded-lg border px-3 py-2", colors[type]].join(" ")}>
      {message}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MarketplaceSettingsTab({ onDirty }: MarketplaceSettingsTabProps) {
  // ─── Static Form State (placeholder data) ─────────────────────────────────
  const [businessName, setBusinessName] = React.useState("Sunrise Puppies");
  const [bio, setBio] = React.useState("Family-owned breeding program focused on health, temperament, and lifelong support for every puppy we place.");
  const [websiteUrl, setWebsiteUrl] = React.useState("https://sunrisepuppies.com");
  const [showWebsite, setShowWebsite] = React.useState(true);
  const [instagram, setInstagram] = React.useState("@sunrisepuppies");
  const [showInstagram, setShowInstagram] = React.useState(true);
  const [facebook, setFacebook] = React.useState("SunrisePuppiesBreeder");
  const [showFacebook, setShowFacebook] = React.useState(false);

  // Location state
  const [street, setStreet] = React.useState("123 Maple Lane");
  const [city, setCity] = React.useState("Portland");
  const [state, setState] = React.useState("OR");
  const [zip, setZip] = React.useState("97201");
  const [country, setCountry] = React.useState("United States");
  const [locationDisplay, setLocationDisplay] = React.useState("city_state");
  const [distanceSearch, setDistanceSearch] = React.useState(true);
  const [citySearch, setCitySearch] = React.useState(true);
  const [zipRadius, setZipRadius] = React.useState(false);

  // Species and breeds
  const [selectedSpecies, setSelectedSpecies] = React.useState<string[]>(["Dog"]);
  const speciesOptions = ["Dog", "Cat", "Horse"];

  // Programs (static mock)
  const [programs, setPrograms] = React.useState([
    { id: "1", name: "Golden Retriever Program", description: "AKC registered Goldens with OFA clearances. Family-raised with early neurological stimulation.", status: true, availability: "Accepting inquiries" },
    { id: "2", name: "Labrador Program", description: "English Labs bred for temperament and conformation.", status: false, availability: "Waitlist only" },
  ]);

  // Credentials state
  const [registrations, setRegistrations] = React.useState<string[]>(["AKC Breeder of Merit", "GANA Member"]);
  const [registrationsNote, setRegistrationsNote] = React.useState("");
  const [healthPractices, setHealthPractices] = React.useState<string[]>(["OFA Hip/Elbow", "PennHIP", "Genetic Testing"]);
  const [healthNote, setHealthNote] = React.useState("");
  const [breedingPractices, setBreedingPractices] = React.useState<string[]>(["Health-tested parents only", "Puppy Culture"]);
  const [breedingNote, setBreedingNote] = React.useState("");
  const [carePractices, setCarePractices] = React.useState<string[]>(["ENS/ESI", "Vet checked"]);
  const [careNote, setCareNote] = React.useState("");

  // Placement policies
  const [requireApplication, setRequireApplication] = React.useState(true);
  const [requireInterview, setRequireInterview] = React.useState(true);
  const [requireContract, setRequireContract] = React.useState(true);
  const [hasReturnPolicy, setHasReturnPolicy] = React.useState(true);
  const [offersSupport, setOffersSupport] = React.useState(true);
  const [placementNote, setPlacementNote] = React.useState("We remain available for the lifetime of every puppy we place.");

  // ─── Dirty tracking ───────────────────────────────────────────────────────
  React.useEffect(() => {
    // In a real implementation, this would compare current vs initial state
    onDirty(false);
  }, [onDirty]);

  // ─── Helper functions ─────────────────────────────────────────────────────
  function toggleSpecies(species: string) {
    setSelectedSpecies((prev) =>
      prev.includes(species) ? prev.filter((s) => s !== species) : [...prev, species]
    );
  }

  function toggleProgram(id: string) {
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: !p.status } : p))
    );
  }

  function toggleCredential(list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) {
    setList((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  }

  function getLocationDisplayText(): string {
    switch (locationDisplay) {
      case "city_state": return `${city}, ${state}`;
      case "zip_only": return zip;
      case "full": return `${city}, ${state} ${zip}`;
      case "hidden": return "Location hidden";
      default: return "";
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-primary">Marketplace Profile</h2>
        <p className="text-sm text-secondary mt-1">
          Control how your breeding business and programs appear in the BreederHQ Marketplace.
        </p>
        {/* Status bar */}
        <div className="flex flex-wrap gap-3 mt-4">
          <Badge variant="green">Marketplace: Visible</Badge>
          <Badge variant="neutral">1 of 2 Programs Listed</Badge>
          <Badge variant="neutral">Last Updated: Jan 2, 2026</Badge>
        </div>
      </div>

      {/* Section 1: Business Identity */}
      <SectionCard title="Business Identity">
        <div className="space-y-4">
          {/* Public Business Name */}
          <div>
            <label className={LABEL_CLS}>Public Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your breeding program name"
              className={INPUT_CLS}
            />
          </div>

          {/* Logo uploader placeholder */}
          <div>
            <label className={LABEL_CLS}>Logo</label>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-lg bg-card border-2 border-dashed border-hairline flex items-center justify-center text-3xl text-secondary">
                🐾
              </div>
              <div className="flex-1">
                <Button variant="outline" size="sm">Upload Logo</Button>
                <p className="text-xs text-secondary mt-2">
                  Recommended: Square image, at least 200×200px. PNG or JPG.
                </p>
              </div>
            </div>
          </div>

          {/* Short Bio */}
          <div>
            <label className={LABEL_CLS}>Short Business Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              placeholder="Describe your breeding program..."
              rows={3}
              className={TEXTAREA_CLS}
            />
            <div className="text-xs text-secondary text-right mt-1">{bio.length}/500</div>
          </div>

          {/* Website */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className={LABEL_CLS}>Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yoursite.com"
                className={INPUT_CLS}
              />
            </div>
            <Toggle checked={showWebsite} onChange={setShowWebsite} label="Show in Marketplace" />
          </div>

          {/* Social links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className={LABEL_CLS}>Instagram</label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@yourbusiness"
                  className={INPUT_CLS}
                />
              </div>
              <Toggle checked={showInstagram} onChange={setShowInstagram} />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className={LABEL_CLS}>Facebook</label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="YourPage"
                  className={INPUT_CLS}
                />
              </div>
              <Toggle checked={showFacebook} onChange={setShowFacebook} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 2: Location and Service Area */}
      <SectionCard title="Location and Service Area">
        <div className="space-y-4">
          <p className={SUBLABEL_CLS}>
            Your full address is kept private. Choose how much to display publicly.
          </p>

          {/* Private address fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={LABEL_CLS}>Street Address (Private)</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>State/Province</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>ZIP/Postal Code</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Public display options */}
          <div>
            <label className={LABEL_CLS}>Public Location Display</label>
            <RadioGroup
              name="locationDisplay"
              value={locationDisplay}
              onChange={setLocationDisplay}
              options={[
                { value: "city_state", label: "City + State (e.g., Portland, OR)" },
                { value: "zip_only", label: "ZIP Code only (e.g., 97201)" },
                { value: "full", label: "City + State + ZIP" },
                { value: "hidden", label: "Hidden from public" },
              ]}
            />
          </div>

          {/* Search participation */}
          <div>
            <label className={LABEL_CLS}>Search Participation</label>
            <div className="space-y-2">
              <Checkbox checked={distanceSearch} onChange={setDistanceSearch} label="Allow distance-based search" />
              <Checkbox checked={citySearch} onChange={setCitySearch} label="Allow city/state search" />
              <Checkbox checked={zipRadius} onChange={setZipRadius} label="Allow ZIP radius search" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 3: Species and Breeds */}
      <SectionCard title="Species and Breeds">
        <div className="space-y-4">
          {/* Species selection */}
          <div>
            <label className={LABEL_CLS}>Species You Breed</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {speciesOptions.map((species) => (
                <SpeciesChip
                  key={species}
                  label={species}
                  selected={selectedSpecies.includes(species)}
                  onClick={() => toggleSpecies(species)}
                />
              ))}
            </div>
          </div>

          {/* Breed selection placeholder */}
          <div className="rounded-lg border border-hairline bg-surface-strong/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-primary">Breed Selection</h4>
                <p className="text-sm text-secondary mt-1">
                  Breed selection will be available here once breed registry integration is enabled.
                </p>
              </div>
              <Badge variant="neutral">Coming Soon</Badge>
            </div>
            {/* Static breed chips placeholder */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-sm bg-surface-strong px-3 py-1 rounded-full border border-hairline flex items-center gap-2">
                Golden Retriever
                <Badge variant="green" className="scale-90">Primary</Badge>
              </span>
              <span className="text-sm bg-surface-strong px-3 py-1 rounded-full border border-hairline">
                Labrador Retriever
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 4: Programs and Listings */}
      <SectionCard title="Programs and Listings">
        <div className="space-y-4">
          <p className={SUBLABEL_CLS}>
            Control which breeding programs appear in the marketplace.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                name={program.name}
                description={program.description}
                status={program.status}
                availability={program.availability}
                onToggle={() => toggleProgram(program.id)}
              />
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Section 5: Standards and Credentials */}
      <SectionCard title="Standards and Credentials">
        <div className="space-y-6">
          <CredentialsChecklist
            title="Registrations and Affiliations"
            items={["AKC Breeder of Merit", "AKC Bred with H.E.A.R.T.", "GANA Member", "GRCA Member", "UKC Registered", "CKC Registered"]}
            selected={registrations}
            onToggle={(item) => toggleCredential(registrations, setRegistrations, item)}
            noteValue={registrationsNote}
            onNoteChange={setRegistrationsNote}
          />

          <CredentialsChecklist
            title="Health and Genetic Practices"
            items={["OFA Hip/Elbow", "OFA Cardiac", "OFA Eyes (CAER)", "PennHIP", "Genetic Testing", "Embark/Wisdom Panel"]}
            selected={healthPractices}
            onToggle={(item) => toggleCredential(healthPractices, setHealthPractices, item)}
            noteValue={healthNote}
            onNoteChange={setHealthNote}
          />

          <CredentialsChecklist
            title="Breeding Practices"
            items={["Health-tested parents only", "Puppy Culture", "Avidog Program", "Breeding soundness exam", "Limited breeding rights", "Co-ownership available"]}
            selected={breedingPractices}
            onToggle={(item) => toggleCredential(breedingPractices, setBreedingPractices, item)}
            noteValue={breedingNote}
            onNoteChange={setBreedingNote}
          />

          <CredentialsChecklist
            title="Care and Early Life"
            items={["ENS/ESI", "Vet checked", "First vaccinations", "Microchipped", "Crate/potty training started", "Socialization protocol"]}
            selected={carePractices}
            onToggle={(item) => toggleCredential(carePractices, setCarePractices, item)}
            noteValue={careNote}
            onNoteChange={setCareNote}
          />
        </div>
      </SectionCard>

      {/* Section 6: Placement Policies */}
      <SectionCard title="Placement Policies">
        <div className="space-y-4">
          <div className="space-y-2">
            <Checkbox checked={requireApplication} onChange={setRequireApplication} label="Require application" />
            <Checkbox checked={requireInterview} onChange={setRequireInterview} label="Require interview/meeting" />
            <Checkbox checked={requireContract} onChange={setRequireContract} label="Require signed contract" />
            <Checkbox checked={hasReturnPolicy} onChange={setHasReturnPolicy} label="Lifetime return policy" />
            <Checkbox checked={offersSupport} onChange={setOffersSupport} label="Ongoing breeder support" />
          </div>
          <div>
            <label className={LABEL_CLS}>Additional Placement Notes</label>
            <textarea
              value={placementNote}
              onChange={(e) => setPlacementNote(e.target.value.slice(0, 300))}
              placeholder="Describe your placement process..."
              rows={3}
              className={TEXTAREA_CLS}
            />
            <div className="text-xs text-secondary text-right mt-1">{placementNote.length}/300</div>
          </div>
        </div>
      </SectionCard>

      {/* Section 7: Trust Signals and Badges */}
      <SectionCard title="Trust Signals and Badges">
        <div className="space-y-4">
          <p className={SUBLABEL_CLS}>
            Badges are earned through verified actions and cannot be manually set. Badge functionality is not yet available.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "Verified Identity" },
              { name: "Health Testing" },
              { name: "5+ Placements" },
              { name: "Quick Responder" },
            ].map((badge) => (
              <div
                key={badge.name}
                className="rounded-lg border p-3 text-center bg-surface-strong/50 border-hairline opacity-60"
              >
                <div className="text-2xl mb-1 text-secondary">○</div>
                <div className="text-xs font-medium text-secondary">{badge.name}</div>
                <div className="text-[10px] text-tertiary mt-1">Locked</div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Section 8: Preview and Validation */}
      <SectionCard title="Preview and Validation">
        <div className="space-y-6">
          {/* Marketplace Preview */}
          <div>
            <label className={LABEL_CLS}>Marketplace Preview</label>
            <p className={SUBLABEL_CLS}>How your listing will appear to buyers.</p>
            <MarketplacePreviewCard
              businessName={businessName}
              locationDisplay={getLocationDisplayText()}
              breeds={["Golden Retriever", "Labrador Retriever"]}
            />
          </div>

          {/* Validation Warnings */}
          <div>
            <label className={LABEL_CLS}>Profile Validation</label>
            <div className="space-y-2">
              <ValidationWarning
                message="Add a logo to improve your listing visibility."
                type="warning"
              />
              <ValidationWarning
                message="Consider adding more health testing credentials."
                type="info"
              />
            </div>
          </div>

          {/* Publish Requirements Checklist */}
          <div>
            <label className={LABEL_CLS}>To publish, complete:</label>
            <div className="space-y-1.5 mt-2">
              {[
                { label: "Business name", done: !!businessName },
                { label: "Logo (optional but recommended)", done: false },
                { label: "At least one species selected", done: selectedSpecies.length > 0 },
                { label: "At least one breed selected", done: false },
                { label: "At least one program listed", done: programs.some((p) => p.status) },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <span className={item.done ? "text-green-400" : "text-secondary"}>
                    {item.done ? "✓" : "○"}
                  </span>
                  <span className={item.done ? "text-primary" : "text-secondary"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-hairline">
            <Button variant="outline">Save Draft</Button>
            <Button disabled title="Complete all required items to publish">
              Publish to Marketplace
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
