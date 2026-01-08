// apps/breeding/src/components/HealthRiskSummary.tsx
import * as React from "react";
import {
  Heart,
  Eye,
  Brain,
  Bone,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Info,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  HelpCircle,
  FileWarning,
  Stethoscope,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

/** Genetic status for a health marker */
export type GeneticStatus = "clear" | "carrier" | "affected" | "unknown";

/** Health condition severity */
export type ConditionSeverity = "mild" | "moderate" | "severe";

/** Health condition category */
export type ConditionCategory =
  | "eye"
  | "blood"
  | "neurological"
  | "orthopedic"
  | "other";

/** Overall health rating for a pairing */
export type HealthRating = "excellent" | "good" | "caution" | "high-risk";

/** Individual health marker from genetics data */
export interface HealthMarker {
  locus: string;
  locusName?: string;
  genotype: string;
  allele1?: string;
  allele2?: string;
}

/** Offspring risk breakdown */
export interface OffspringRisk {
  clearPercent: number;
  carrierPercent: number;
  affectedPercent: number;
}

/** Processed health condition for display */
export interface HealthCondition {
  id: string;
  name: string;
  fullName: string;
  category: ConditionCategory;
  damStatus: GeneticStatus;
  sireStatus: GeneticStatus;
  offspringRisk: OffspringRisk;
  severity: ConditionSeverity;
  description?: string;
  affectedSymptoms?: string;
}

/** Recommended test item */
export interface RecommendedTest {
  condition: string;
  parent: "dam" | "sire" | "both";
  priority: "high" | "medium" | "low";
  reason: string;
}

/** Pairing recommendation */
export interface PairingRecommendation {
  type: "proceed" | "caution" | "avoid" | "test-first";
  message: string;
  details?: string;
}

/** Props for the HealthRiskSummary component */
export interface HealthRiskSummaryProps {
  /** Health markers from dam */
  damGenetics: HealthMarker[];
  /** Health markers from sire */
  sireGenetics: HealthMarker[];
  /** Species for species-specific conditions */
  species: string;
  /** Pre-calculated results (optional) */
  calculatedResults?: {
    health: Array<{
      trait: string;
      damGenotype: string;
      sireGenotype: string;
      prediction: string;
      warning?: boolean;
      breedSpecific?: string | null;
    }>;
  };
  /** Dam's name for display */
  damName?: string;
  /** Sire's name for display */
  sireName?: string;
  /** Additional CSS classes */
  className?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Constants: Health condition definitions
 * ───────────────────────────────────────────────────────────────────────────── */

/** Mapping of common health condition loci to their details */
const CONDITION_DEFINITIONS: Record<
  string,
  {
    fullName: string;
    category: ConditionCategory;
    severity: ConditionSeverity;
    description: string;
    affectedSymptoms: string;
  }
> = {
  // Eye conditions
  PRA: {
    fullName: "Progressive Retinal Atrophy",
    category: "eye",
    severity: "severe",
    description: "Degenerative eye disease causing blindness",
    affectedSymptoms: "Night blindness progressing to complete vision loss",
  },
  "PRA-PRCD": {
    fullName: "Progressive Rod-Cone Degeneration",
    category: "eye",
    severity: "severe",
    description: "Form of PRA affecting rod and cone cells",
    affectedSymptoms: "Progressive vision loss starting in dim light",
  },
  CEA: {
    fullName: "Collie Eye Anomaly",
    category: "eye",
    severity: "moderate",
    description: "Congenital eye defect affecting the choroid",
    affectedSymptoms: "Mild vision impairment to blindness depending on severity",
  },
  HC: {
    fullName: "Hereditary Cataracts",
    category: "eye",
    severity: "moderate",
    description: "Cloudiness of the lens causing vision impairment",
    affectedSymptoms: "Progressive vision loss, may require surgery",
  },
  PPM: {
    fullName: "Persistent Pupillary Membranes",
    category: "eye",
    severity: "mild",
    description: "Remnants of fetal eye tissue",
    affectedSymptoms: "Usually minor, may cause slight vision impairment",
  },
  GLAUCOMA: {
    fullName: "Primary Glaucoma",
    category: "eye",
    severity: "severe",
    description: "Increased pressure within the eye",
    affectedSymptoms: "Pain, redness, vision loss, potential blindness",
  },

  // Blood disorders
  VWD: {
    fullName: "Von Willebrand Disease",
    category: "blood",
    severity: "moderate",
    description: "Blood clotting disorder due to deficient clotting factor",
    affectedSymptoms: "Excessive bleeding, prolonged bleeding time",
  },
  "VWD1": {
    fullName: "Von Willebrand Disease Type 1",
    category: "blood",
    severity: "mild",
    description: "Mildest form of VWD with reduced clotting factor",
    affectedSymptoms: "Mild bleeding tendencies, usually manageable",
  },
  "VWD2": {
    fullName: "Von Willebrand Disease Type 2",
    category: "blood",
    severity: "moderate",
    description: "Moderate form with qualitative factor defect",
    affectedSymptoms: "Moderate bleeding episodes, surgical risk",
  },
  "VWD3": {
    fullName: "Von Willebrand Disease Type 3",
    category: "blood",
    severity: "severe",
    description: "Severe form with near-absence of clotting factor",
    affectedSymptoms: "Severe hemorrhaging, life-threatening without management",
  },
  "FACTOR-VII": {
    fullName: "Factor VII Deficiency",
    category: "blood",
    severity: "mild",
    description: "Clotting factor deficiency causing mild bleeding",
    affectedSymptoms: "Minor bruising, rarely clinically significant",
  },
  "FACTOR-IX": {
    fullName: "Hemophilia B (Factor IX Deficiency)",
    category: "blood",
    severity: "severe",
    description: "X-linked bleeding disorder",
    affectedSymptoms: "Spontaneous bleeding, joint problems, severe cases fatal",
  },
  PKD: {
    fullName: "Pyruvate Kinase Deficiency",
    category: "blood",
    severity: "severe",
    description: "Enzyme deficiency causing red blood cell destruction",
    affectedSymptoms: "Chronic anemia, lethargy, reduced lifespan",
  },

  // Neurological conditions
  DM: {
    fullName: "Degenerative Myelopathy",
    category: "neurological",
    severity: "severe",
    description: "Progressive spinal cord disease similar to ALS",
    affectedSymptoms: "Rear limb weakness, paralysis, typically fatal",
  },
  EIC: {
    fullName: "Exercise-Induced Collapse",
    category: "neurological",
    severity: "moderate",
    description: "Collapse during intense exercise due to nerve dysfunction",
    affectedSymptoms: "Weakness and collapse after 5-25 min of exercise",
  },
  NCL: {
    fullName: "Neuronal Ceroid Lipofuscinosis",
    category: "neurological",
    severity: "severe",
    description: "Fatal neurodegenerative storage disease",
    affectedSymptoms: "Vision loss, seizures, behavioral changes, death",
  },
  EPILEPSY: {
    fullName: "Idiopathic Epilepsy",
    category: "neurological",
    severity: "moderate",
    description: "Recurring seizures without known cause",
    affectedSymptoms: "Seizures varying from mild to severe, manageable with medication",
  },
  CNM: {
    fullName: "Centronuclear Myopathy",
    category: "neurological",
    severity: "severe",
    description: "Muscle weakness disease affecting movement",
    affectedSymptoms: "Severe muscle weakness, exercise intolerance, difficulty eating",
  },

  // Orthopedic/Skeletal
  HD: {
    fullName: "Hip Dysplasia (Genetic Component)",
    category: "orthopedic",
    severity: "moderate",
    description: "Malformation of the hip joint",
    affectedSymptoms: "Lameness, arthritis, reduced mobility",
  },
  ED: {
    fullName: "Elbow Dysplasia (Genetic Component)",
    category: "orthopedic",
    severity: "moderate",
    description: "Malformation of the elbow joint",
    affectedSymptoms: "Front leg lameness, arthritis",
  },
  OI: {
    fullName: "Osteogenesis Imperfecta",
    category: "orthopedic",
    severity: "severe",
    description: "Brittle bone disease",
    affectedSymptoms: "Fragile bones, frequent fractures, often lethal",
  },
  CDDY: {
    fullName: "Chondrodystrophy (CDDY/IVDD)",
    category: "orthopedic",
    severity: "moderate",
    description: "Dwarfism and disc disease predisposition",
    affectedSymptoms: "Intervertebral disc disease risk, back problems",
  },
  CDPA: {
    fullName: "Chondrodysplasia Punctata",
    category: "orthopedic",
    severity: "severe",
    description: "Skeletal abnormalities affecting cartilage",
    affectedSymptoms: "Skeletal deformities, shortened limbs, breathing difficulties",
  },

  // Other conditions
  MDR1: {
    fullName: "Multi-Drug Resistance 1 Gene",
    category: "other",
    severity: "moderate",
    description: "Sensitivity to certain medications",
    affectedSymptoms: "Severe reactions to ivermectin and other drugs",
  },
  HUU: {
    fullName: "Hyperuricosuria",
    category: "other",
    severity: "mild",
    description: "Elevated uric acid causing bladder stones",
    affectedSymptoms: "Bladder/kidney stones, urinary tract issues",
  },
  CYSTINURIA: {
    fullName: "Cystinuria",
    category: "other",
    severity: "moderate",
    description: "Amino acid transport defect causing stones",
    affectedSymptoms: "Urinary stones, blockages, kidney damage",
  },
  CMR1: {
    fullName: "Canine Multifocal Retinopathy 1",
    category: "eye",
    severity: "mild",
    description: "Retinal folds and detachments",
    affectedSymptoms: "Usually minor, may cause vision impairment",
  },
  DCM: {
    fullName: "Dilated Cardiomyopathy (Genetic)",
    category: "other",
    severity: "severe",
    description: "Heart muscle disease causing enlarged heart",
    affectedSymptoms: "Heart failure, arrhythmia, sudden death",
  },
  JDCM: {
    fullName: "Juvenile Dilated Cardiomyopathy",
    category: "other",
    severity: "severe",
    description: "Early-onset heart muscle disease",
    affectedSymptoms: "Heart failure in puppies, usually fatal",
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Utility functions
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Parse genotype string to determine genetic status
 */
function parseGeneticStatus(genotype: string): GeneticStatus {
  if (!genotype || genotype.toLowerCase() === "unknown" || genotype === "?") {
    return "unknown";
  }

  const lower = genotype.toLowerCase();

  // Check for explicit status keywords
  if (lower.includes("clear") || lower.includes("normal") || lower === "n/n") {
    return "clear";
  }
  if (lower.includes("affected") || lower === "a/a") {
    return "affected";
  }
  if (lower.includes("carrier") || lower === "n/a" || lower === "a/n") {
    return "carrier";
  }

  // Parse allele notation (e.g., "N/N", "N/M", "M/M")
  const parts = genotype.split("/").map((p) => p.trim().toUpperCase());
  if (parts.length === 2) {
    const [a1, a2] = parts;
    // N = normal/clear, other letters typically indicate mutation
    if (a1 === "N" && a2 === "N") return "clear";
    if (a1 === "N" || a2 === "N") return "carrier";
    if (a1 !== "N" && a2 !== "N" && a1 === a2) return "affected";
  }

  return "unknown";
}

/**
 * Calculate offspring risk based on parental genotypes
 */
function calculateOffspringRisk(
  damStatus: GeneticStatus,
  sireStatus: GeneticStatus
): OffspringRisk {
  // Handle unknown cases
  if (damStatus === "unknown" || sireStatus === "unknown") {
    return { clearPercent: 0, carrierPercent: 0, affectedPercent: 0 };
  }

  // Mendelian inheritance calculations
  if (damStatus === "clear" && sireStatus === "clear") {
    return { clearPercent: 100, carrierPercent: 0, affectedPercent: 0 };
  }

  if (
    (damStatus === "clear" && sireStatus === "carrier") ||
    (damStatus === "carrier" && sireStatus === "clear")
  ) {
    return { clearPercent: 50, carrierPercent: 50, affectedPercent: 0 };
  }

  if (damStatus === "carrier" && sireStatus === "carrier") {
    return { clearPercent: 25, carrierPercent: 50, affectedPercent: 25 };
  }

  if (
    (damStatus === "clear" && sireStatus === "affected") ||
    (damStatus === "affected" && sireStatus === "clear")
  ) {
    return { clearPercent: 0, carrierPercent: 100, affectedPercent: 0 };
  }

  if (
    (damStatus === "carrier" && sireStatus === "affected") ||
    (damStatus === "affected" && sireStatus === "carrier")
  ) {
    return { clearPercent: 0, carrierPercent: 50, affectedPercent: 50 };
  }

  if (damStatus === "affected" && sireStatus === "affected") {
    return { clearPercent: 0, carrierPercent: 0, affectedPercent: 100 };
  }

  return { clearPercent: 0, carrierPercent: 0, affectedPercent: 0 };
}

/**
 * Determine overall health rating based on all conditions
 */
function calculateHealthRating(conditions: HealthCondition[]): HealthRating {
  let maxAffectedRisk = 0;
  let hasCarriers = false;

  for (const condition of conditions) {
    const { affectedPercent, carrierPercent } = condition.offspringRisk;

    if (affectedPercent > maxAffectedRisk) {
      maxAffectedRisk = affectedPercent;
    }
    if (carrierPercent > 0) {
      hasCarriers = true;
    }
  }

  if (maxAffectedRisk >= 50) return "high-risk";
  if (maxAffectedRisk >= 25) return "caution";
  if (hasCarriers) return "good";
  return "excellent";
}

/**
 * Get category icon component
 */
function getCategoryIcon(category: ConditionCategory) {
  switch (category) {
    case "eye":
      return Eye;
    case "blood":
      return Droplets;
    case "neurological":
      return Brain;
    case "orthopedic":
      return Bone;
    default:
      return Heart;
  }
}

/**
 * Get category display label
 */
function getCategoryLabel(category: ConditionCategory): string {
  switch (category) {
    case "eye":
      return "Eye Conditions";
    case "blood":
      return "Blood Disorders";
    case "neurological":
      return "Neurological";
    case "orthopedic":
      return "Orthopedic / Skeletal";
    default:
      return "Other Conditions";
  }
}

/**
 * Get status display info
 */
function getStatusInfo(status: GeneticStatus): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  switch (status) {
    case "clear":
      return {
        label: "Clear",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/30",
      };
    case "carrier":
      return {
        label: "Carrier",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/30",
      };
    case "affected":
      return {
        label: "Affected",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
      };
    default:
      return {
        label: "Unknown",
        color: "text-gray-500 dark:text-gray-400",
        bgColor: "bg-gray-500/10",
        borderColor: "border-gray-500/30",
      };
  }
}

/**
 * Get severity display info
 */
function getSeverityInfo(severity: ConditionSeverity): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (severity) {
    case "mild":
      return {
        label: "Mild",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10",
      };
    case "moderate":
      return {
        label: "Moderate",
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-500/10",
      };
    case "severe":
      return {
        label: "Severe",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-500/10",
      };
  }
}

/**
 * Get health rating display info
 */
function getHealthRatingInfo(rating: HealthRating): {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  Icon: React.ComponentType<{ className?: string }>;
} {
  switch (rating) {
    case "excellent":
      return {
        label: "Excellent",
        description: "All clear - no health concerns identified",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/40",
        Icon: ShieldCheck,
      };
    case "good":
      return {
        label: "Good",
        description: "Carriers present but no at-risk offspring expected",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/40",
        Icon: Shield,
      };
    case "caution":
      return {
        label: "Caution",
        description: "25%+ risk of affected offspring for one or more conditions",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/40",
        Icon: ShieldAlert,
      };
    case "high-risk":
      return {
        label: "High Risk",
        description: "50%+ risk of affected offspring - pairing not recommended",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/40",
        Icon: ShieldX,
      };
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Sub-components
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: GeneticStatus }) {
  const info = getStatusInfo(status);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${info.bgColor} ${info.color} border ${info.borderColor}`}
    >
      {info.label}
    </span>
  );
}

/**
 * Offspring risk bar visualization
 */
function OffspringRiskBar({ risk }: { risk: OffspringRisk }) {
  const { clearPercent, carrierPercent, affectedPercent } = risk;
  const hasData = clearPercent > 0 || carrierPercent > 0 || affectedPercent > 0;

  if (!hasData) {
    return (
      <div className="text-xs text-gray-500 italic">
        Testing needed for risk calculation
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        {clearPercent > 0 && (
          <div
            className="bg-green-500 transition-all duration-300"
            style={{ width: `${clearPercent}%` }}
            title={`${clearPercent}% Clear`}
          />
        )}
        {carrierPercent > 0 && (
          <div
            className="bg-yellow-500 transition-all duration-300"
            style={{ width: `${carrierPercent}%` }}
            title={`${carrierPercent}% Carrier`}
          />
        )}
        {affectedPercent > 0 && (
          <div
            className="bg-red-500 transition-all duration-300"
            style={{ width: `${affectedPercent}%` }}
            title={`${affectedPercent}% Affected`}
          />
        )}
      </div>
      <div className="flex justify-between text-[10px] text-secondary">
        {clearPercent > 0 && (
          <span className="text-green-600 dark:text-green-400">
            {clearPercent}% Clear
          </span>
        )}
        {carrierPercent > 0 && (
          <span className="text-yellow-600 dark:text-yellow-400">
            {carrierPercent}% Carrier
          </span>
        )}
        {affectedPercent > 0 && (
          <span className="text-red-600 dark:text-red-400">
            {affectedPercent}% Affected
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Individual condition row (expandable)
 */
function ConditionRow({
  condition,
  damName,
  sireName,
}: {
  condition: HealthCondition;
  damName?: string;
  sireName?: string;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const severityInfo = getSeverityInfo(condition.severity);
  const hasRisk = condition.offspringRisk.affectedPercent > 0;

  return (
    <div
      className={`border rounded-lg transition-all ${
        hasRisk
          ? "border-red-500/30 bg-red-500/5"
          : "border-hairline bg-surface"
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-hairline/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {condition.name}
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${severityInfo.bgColor} ${severityInfo.color}`}
              >
                {severityInfo.label}
              </span>
            </div>
            <div className="text-xs text-secondary truncate">
              {condition.fullName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Parent statuses */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-center">
              <div className="text-[10px] text-secondary mb-0.5">
                {damName || "Dam"}
              </div>
              <StatusBadge status={condition.damStatus} />
            </div>
            <div className="text-secondary">x</div>
            <div className="text-center">
              <div className="text-[10px] text-secondary mb-0.5">
                {sireName || "Sire"}
              </div>
              <StatusBadge status={condition.sireStatus} />
            </div>
          </div>

          {/* Risk indicator */}
          {hasRisk && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">
                {condition.offspringRisk.affectedPercent}% Risk
              </span>
            </div>
          )}

          {/* Expand icon */}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-secondary" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-3 border-t border-hairline">
          {/* Mobile: Parent statuses */}
          <div className="sm:hidden flex items-center gap-2 pt-3">
            <div className="text-center flex-1">
              <div className="text-[10px] text-secondary mb-1">
                {damName || "Dam"}
              </div>
              <StatusBadge status={condition.damStatus} />
            </div>
            <div className="text-secondary">x</div>
            <div className="text-center flex-1">
              <div className="text-[10px] text-secondary mb-1">
                {sireName || "Sire"}
              </div>
              <StatusBadge status={condition.sireStatus} />
            </div>
          </div>

          {/* Offspring risk breakdown */}
          <div className="pt-2">
            <div className="text-xs font-medium text-secondary mb-2">
              Offspring Risk Breakdown
            </div>
            <OffspringRiskBar risk={condition.offspringRisk} />
          </div>

          {/* Condition details */}
          {condition.description && (
            <div className="pt-2">
              <div className="text-xs font-medium text-secondary mb-1">
                About This Condition
              </div>
              <p className="text-sm text-secondary">{condition.description}</p>
            </div>
          )}

          {condition.affectedSymptoms && (
            <div className="pt-1">
              <div className="text-xs font-medium text-secondary mb-1">
                Affected Animals May Experience
              </div>
              <p className="text-sm text-secondary">
                {condition.affectedSymptoms}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Category section with grouped conditions
 */
function CategorySection({
  category,
  conditions,
  damName,
  sireName,
}: {
  category: ConditionCategory;
  conditions: HealthCondition[];
  damName?: string;
  sireName?: string;
}) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const Icon = getCategoryIcon(category);
  const label = getCategoryLabel(category);

  const hasAnyRisk = conditions.some(
    (c) => c.offspringRisk.affectedPercent > 0
  );
  const allClear = conditions.every(
    (c) => c.damStatus === "clear" && c.sireStatus === "clear"
  );

  return (
    <div className="border border-hairline rounded-xl overflow-hidden bg-surface">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-hairline/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              hasAnyRisk
                ? "bg-red-500/10 text-red-600"
                : allClear
                ? "bg-green-500/10 text-green-600"
                : "bg-blue-500/10 text-blue-600"
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="font-semibold">{label}</div>
            <div className="text-xs text-secondary">
              {conditions.length} condition{conditions.length !== 1 ? "s" : ""}{" "}
              tested
              {hasAnyRisk && (
                <span className="text-red-600 dark:text-red-400 ml-2">
                  - Risk detected
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allClear && (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          )}
          {hasAnyRisk && (
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-secondary" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {conditions.map((condition) => (
            <ConditionRow
              key={condition.id}
              condition={condition}
              damName={damName}
              sireName={sireName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Recommended tests section
 */
function RecommendedTestsSection({
  tests,
  damName,
  sireName,
}: {
  tests: RecommendedTest[];
  damName?: string;
  sireName?: string;
}) {
  if (tests.length === 0) return null;

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedTests = [...tests].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-500/10 border-red-500/30";
      case "medium":
        return "text-yellow-600 bg-yellow-500/10 border-yellow-500/30";
      case "low":
        return "text-blue-600 bg-blue-500/10 border-blue-500/30";
    }
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-orange-500/40 bg-orange-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        <h4 className="font-semibold text-orange-600 dark:text-orange-400">
          Recommended Testing
        </h4>
      </div>
      <p className="text-sm text-secondary mb-4">
        The following tests are recommended to complete the health profile for
        this pairing:
      </p>
      <div className="space-y-2">
        {sortedTests.map((test, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 p-3 rounded-lg border ${getPriorityColor(
              test.priority
            )}`}
          >
            <Stethoscope className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{test.condition}</div>
              <div className="text-xs opacity-80">
                Test needed for:{" "}
                {test.parent === "dam"
                  ? damName || "Dam"
                  : test.parent === "sire"
                  ? sireName || "Sire"
                  : "Both parents"}
              </div>
              <div className="text-xs mt-1">{test.reason}</div>
            </div>
            <span className="text-[10px] font-medium uppercase shrink-0">
              {test.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Pairing recommendations section
 */
function PairingRecommendationsSection({
  recommendations,
}: {
  recommendations: PairingRecommendation[];
}) {
  if (recommendations.length === 0) return null;

  const getRecommendationStyle = (type: PairingRecommendation["type"]) => {
    switch (type) {
      case "proceed":
        return {
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          icon: CheckCircle2,
          iconColor: "text-green-600 dark:text-green-400",
        };
      case "caution":
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
          icon: AlertTriangle,
          iconColor: "text-yellow-600 dark:text-yellow-400",
        };
      case "avoid":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          icon: ShieldX,
          iconColor: "text-red-600 dark:text-red-400",
        };
      case "test-first":
        return {
          bg: "bg-orange-500/10",
          border: "border-orange-500/30",
          icon: FileWarning,
          iconColor: "text-orange-600 dark:text-orange-400",
        };
    }
  };

  return (
    <div className="rounded-xl border border-hairline bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-5 h-5 text-accent" />
        <h4 className="font-semibold">Pairing Recommendations</h4>
      </div>
      <div className="space-y-2">
        {recommendations.map((rec, idx) => {
          const style = getRecommendationStyle(rec.type);
          const Icon = style.icon;
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${style.iconColor}`} />
              <div>
                <div className="font-medium text-sm">{rec.message}</div>
                {rec.details && (
                  <div className="text-xs text-secondary mt-1">
                    {rec.details}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ───────────────────────────────────────────────────────────────────────────── */

export default function HealthRiskSummary({
  damGenetics,
  sireGenetics,
  species,
  calculatedResults,
  damName,
  sireName,
  className = "",
}: HealthRiskSummaryProps) {
  // Process health conditions from genetics data
  const processedConditions = React.useMemo(() => {
    const conditions: HealthCondition[] = [];
    const damLoci = new Map(damGenetics.map((g) => [g.locus.toUpperCase(), g]));
    const sireLoci = new Map(
      sireGenetics.map((g) => [g.locus.toUpperCase(), g])
    );
    const allLoci = new Set([...damLoci.keys(), ...sireLoci.keys()]);

    for (const locus of allLoci) {
      const damMarker = damLoci.get(locus);
      const sireMarker = sireLoci.get(locus);

      const damStatus = damMarker
        ? parseGeneticStatus(damMarker.genotype)
        : "unknown";
      const sireStatus = sireMarker
        ? parseGeneticStatus(sireMarker.genotype)
        : "unknown";

      const definition = CONDITION_DEFINITIONS[locus];
      const offspringRisk = calculateOffspringRisk(damStatus, sireStatus);

      conditions.push({
        id: locus,
        name: locus,
        fullName: definition?.fullName || damMarker?.locusName || sireMarker?.locusName || locus,
        category: definition?.category || "other",
        damStatus,
        sireStatus,
        offspringRisk,
        severity: definition?.severity || "moderate",
        description: definition?.description,
        affectedSymptoms: definition?.affectedSymptoms,
      });
    }

    // Also process calculatedResults if provided
    if (calculatedResults?.health) {
      for (const result of calculatedResults.health) {
        // Extract locus from trait string (e.g., "PRA (Progressive Retinal Atrophy)")
        const locusMatch = result.trait.match(/^([A-Z0-9-]+)/i);
        const locus = locusMatch ? locusMatch[1].toUpperCase() : result.trait;

        // Skip if already processed
        if (conditions.some((c) => c.id === locus)) continue;

        const damStatus = parseGeneticStatus(result.damGenotype);
        const sireStatus = parseGeneticStatus(result.sireGenotype);
        const definition = CONDITION_DEFINITIONS[locus];
        const offspringRisk = calculateOffspringRisk(damStatus, sireStatus);

        conditions.push({
          id: locus,
          name: locus,
          fullName: definition?.fullName || result.trait,
          category: definition?.category || "other",
          damStatus,
          sireStatus,
          offspringRisk,
          severity: definition?.severity || "moderate",
          description: definition?.description,
          affectedSymptoms: definition?.affectedSymptoms,
        });
      }
    }

    return conditions;
  }, [damGenetics, sireGenetics, calculatedResults]);

  // Group conditions by category
  const groupedConditions = React.useMemo(() => {
    const groups: Record<ConditionCategory, HealthCondition[]> = {
      eye: [],
      blood: [],
      neurological: [],
      orthopedic: [],
      other: [],
    };

    for (const condition of processedConditions) {
      groups[condition.category].push(condition);
    }

    // Sort each group by severity (severe first)
    const severityOrder: Record<ConditionSeverity, number> = {
      severe: 0,
      moderate: 1,
      mild: 2,
    };

    for (const cat of Object.keys(groups) as ConditionCategory[]) {
      groups[cat].sort(
        (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
      );
    }

    return groups;
  }, [processedConditions]);

  // Calculate overall health rating
  const healthRating = React.useMemo(
    () => calculateHealthRating(processedConditions),
    [processedConditions]
  );

  const ratingInfo = getHealthRatingInfo(healthRating);

  // Generate recommended tests
  const recommendedTests = React.useMemo(() => {
    const tests: RecommendedTest[] = [];

    for (const condition of processedConditions) {
      const damNeeds = condition.damStatus === "unknown";
      const sireNeeds = condition.sireStatus === "unknown";

      if (damNeeds || sireNeeds) {
        // Check if the other parent is a carrier or affected (higher priority)
        const otherStatus = damNeeds
          ? condition.sireStatus
          : condition.damStatus;
        const priority =
          otherStatus === "affected"
            ? "high"
            : otherStatus === "carrier"
            ? "medium"
            : "low";

        tests.push({
          condition: condition.fullName,
          parent: damNeeds && sireNeeds ? "both" : damNeeds ? "dam" : "sire",
          priority,
          reason:
            otherStatus !== "unknown" && otherStatus !== "clear"
              ? `Other parent is ${otherStatus} - testing critical for risk assessment`
              : "Complete genetic profile for comprehensive health screening",
        });
      }
    }

    return tests;
  }, [processedConditions]);

  // Generate pairing recommendations
  const recommendations = React.useMemo(() => {
    const recs: PairingRecommendation[] = [];

    const highRiskConditions = processedConditions.filter(
      (c) => c.offspringRisk.affectedPercent >= 50
    );
    const cautionConditions = processedConditions.filter(
      (c) =>
        c.offspringRisk.affectedPercent >= 25 &&
        c.offspringRisk.affectedPercent < 50
    );
    const unknownConditions = processedConditions.filter(
      (c) => c.damStatus === "unknown" || c.sireStatus === "unknown"
    );

    if (highRiskConditions.length > 0) {
      const severe = highRiskConditions.filter((c) => c.severity === "severe");
      if (severe.length > 0) {
        recs.push({
          type: "avoid",
          message: `This pairing is not recommended due to high risk of severe conditions`,
          details: `${severe.map((c) => c.fullName).join(", ")} have 50%+ chance of producing affected offspring`,
        });
      } else {
        recs.push({
          type: "caution",
          message: `High risk for ${highRiskConditions.length} condition(s) - consider alternative pairing`,
          details: `Affected: ${highRiskConditions.map((c) => c.name).join(", ")}`,
        });
      }
    }

    if (cautionConditions.length > 0 && highRiskConditions.length === 0) {
      recs.push({
        type: "caution",
        message: `Carrier x Carrier pairing for ${cautionConditions.length} condition(s)`,
        details: `25% risk for: ${cautionConditions.map((c) => c.name).join(", ")}. Consider genetic counseling.`,
      });
    }

    if (unknownConditions.length > 0) {
      recs.push({
        type: "test-first",
        message: `${unknownConditions.length} condition(s) require testing before proceeding`,
        details: "Complete recommended testing for full risk assessment",
      });
    }

    if (
      recs.length === 0 &&
      processedConditions.length > 0 &&
      processedConditions.every(
        (c) =>
          c.offspringRisk.affectedPercent === 0 &&
          c.damStatus !== "unknown" &&
          c.sireStatus !== "unknown"
      )
    ) {
      recs.push({
        type: "proceed",
        message: "This pairing has an excellent health profile",
        details:
          "All tested conditions show no risk of producing affected offspring",
      });
    }

    return recs;
  }, [processedConditions]);

  // Check if we have any data to display
  const hasData = processedConditions.length > 0;

  if (!hasData) {
    return (
      <div
        className={`rounded-xl border border-hairline bg-surface p-6 ${className}`}
      >
        <div className="text-center py-8">
          <HelpCircle className="w-12 h-12 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No Health Data Available</h3>
          <p className="text-sm text-secondary max-w-md mx-auto">
            Add health marker genetic data for both parents to see a
            comprehensive health risk assessment for this pairing.
          </p>
        </div>
      </div>
    );
  }

  const categoryOrder: ConditionCategory[] = [
    "eye",
    "blood",
    "neurological",
    "orthopedic",
    "other",
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Health Rating Header */}
      <div
        className={`rounded-xl border-2 ${ratingInfo.borderColor} ${ratingInfo.bgColor} p-4`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center ${ratingInfo.bgColor}`}
          >
            <ratingInfo.Icon className={`w-8 h-8 ${ratingInfo.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`text-xl font-bold ${ratingInfo.color}`}>
                {ratingInfo.label}
              </h3>
              <span className="text-sm text-secondary">Health Rating</span>
            </div>
            <p className="text-sm text-secondary mt-1">
              {ratingInfo.description}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-sm text-secondary">Conditions Tested</div>
            <div className="text-2xl font-bold">
              {processedConditions.length}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-hairline/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {
                processedConditions.filter(
                  (c) =>
                    c.damStatus === "clear" &&
                    c.sireStatus === "clear"
                ).length
              }
            </div>
            <div className="text-xs text-secondary">All Clear</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {
                processedConditions.filter(
                  (c) =>
                    c.offspringRisk.carrierPercent > 0 &&
                    c.offspringRisk.affectedPercent === 0
                ).length
              }
            </div>
            <div className="text-xs text-secondary">Carrier Risk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {
                processedConditions.filter(
                  (c) => c.offspringRisk.affectedPercent > 0
                ).length
              }
            </div>
            <div className="text-xs text-secondary">At Risk</div>
          </div>
        </div>
      </div>

      {/* Condition categories */}
      {categoryOrder.map((category) => {
        const conditions = groupedConditions[category];
        if (conditions.length === 0) return null;

        return (
          <CategorySection
            key={category}
            category={category}
            conditions={conditions}
            damName={damName}
            sireName={sireName}
          />
        );
      })}

      {/* Recommended tests */}
      {recommendedTests.length > 0 && (
        <RecommendedTestsSection
          tests={recommendedTests}
          damName={damName}
          sireName={sireName}
        />
      )}

      {/* Pairing recommendations */}
      {recommendations.length > 0 && (
        <PairingRecommendationsSection recommendations={recommendations} />
      )}

      {/* Educational footer */}
      <div className="flex items-start gap-2 text-xs text-secondary pt-4 border-t border-hairline">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          <strong>Note:</strong> This health risk assessment is based on known
          genetic markers and Mendelian inheritance patterns. Actual outcomes
          may vary. Always consult with a veterinary geneticist for complex
          breeding decisions. Some conditions may have environmental or
          polygenic factors not captured by single-gene testing.
        </p>
      </div>
    </div>
  );
}

/**
 * Export types for external use
 */
export type {
  HealthMarker,
  HealthCondition,
  OffspringRisk,
  RecommendedTest,
  PairingRecommendation,
};
