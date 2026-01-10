// apps/breeding/src/components/BreedingGoalPlanner.tsx
import * as React from "react";
import { Tooltip } from "@bhq/ui";
import type { GeneticsResults, LocusPrediction, HealthPrediction } from "./OffspringSimulator";

/**
 * Goal priority categories
 */
export type GoalPriority = "must_have" | "nice_to_have" | "must_avoid";

/**
 * Goal status based on genetic analysis
 */
export type GoalStatus = "achievable" | "possible" | "unlikely" | "impossible";

/**
 * Types of traits that can be set as goals
 */
export type GoalTraitType = "coat_color" | "coat_type" | "health" | "physical" | "eye_color";

/**
 * A single breeding goal
 */
export interface BreedingGoal {
  id: string;
  traitType: GoalTraitType;
  traitName: string;
  targetValue: string;
  priority: GoalPriority;
  notes?: string;
  createdAt: string;
}

/**
 * Goal evaluation result after analyzing genetics
 */
export interface GoalEvaluation {
  goal: BreedingGoal;
  status: GoalStatus;
  probability: number; // 0-100
  explanation: string;
  relatedPredictions?: LocusPrediction[] | HealthPrediction[];
}

/**
 * Props for the BreedingGoalPlanner component
 */
export interface BreedingGoalPlannerProps {
  /** Current genetic results from the pairing calculation (can also use 'results' alias) */
  geneticsResults?: GeneticsResults | null;
  /** Alias for geneticsResults for compatibility */
  results?: GeneticsResults | null;
  /** Saved goals (from localStorage or API) - defaults to empty array with internal state */
  savedGoals?: BreedingGoal[];
  /** Species for trait suggestions */
  species?: string;
  /** Dam name for display */
  damName?: string;
  /** Sire name for display */
  sireName?: string;
  /** Callback when goals are updated - if not provided, uses internal state */
  onGoalsChange?: (goals: BreedingGoal[]) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Common coat color targets by species
 */
const COAT_COLOR_SUGGESTIONS: Record<string, string[]> = {
  DOG: [
    "Solid Black",
    "Solid Liver/Chocolate",
    "Blue/Gray",
    "Isabella/Lilac",
    "Red/Yellow",
    "Cream",
    "Fawn",
    "White",
    "Merle",
    "Brindle",
    "Tan Points",
    "Sable",
    "Parti/Piebald",
  ],
  CAT: [
    "Solid Black",
    "Solid White",
    "Orange/Red",
    "Blue/Gray",
    "Cream",
    "Tabby",
    "Colorpoint",
    "Tortoiseshell",
    "Calico",
  ],
  HORSE: [
    "Bay",
    "Black",
    "Chestnut",
    "Palomino",
    "Buckskin",
    "Gray",
    "Cremello",
    "Tobiano",
    "Overo",
    "Appaloosa",
  ],
  default: ["Black", "Brown", "White", "Gray", "Red"],
};

/**
 * Common health clearances to target
 */
const HEALTH_CLEARANCE_SUGGESTIONS: Record<string, string[]> = {
  DOG: [
    "PRA (Progressive Retinal Atrophy)",
    "DM (Degenerative Myelopathy)",
    "vWD (von Willebrand Disease)",
    "EIC (Exercise Induced Collapse)",
    "MDR1 (Multi-Drug Resistance)",
    "DCM (Dilated Cardiomyopathy)",
    "HUU (Hyperuricosuria)",
    "CDDY (Chondrodystrophy)",
    "CDPA (Chondrodysplasia)",
  ],
  CAT: [
    "PKD (Polycystic Kidney Disease)",
    "HCM (Hypertrophic Cardiomyopathy)",
    "PRA (Progressive Retinal Atrophy)",
    "SMA (Spinal Muscular Atrophy)",
  ],
  HORSE: [
    "HYPP (Hyperkalemic Periodic Paralysis)",
    "GBED (Glycogen Branching Enzyme Deficiency)",
    "HERDA (Hereditary Equine Regional Dermal Asthenia)",
    "OLWS (Overo Lethal White Syndrome)",
  ],
  default: ["Clear of known genetic diseases"],
};

/**
 * Traits to avoid (dangerous combinations)
 */
const AVOID_SUGGESTIONS: Record<string, string[]> = {
  DOG: [
    "Double Merle (M/M)",
    "Lethal White",
    "Double Dilute Health Issues",
    "Brachycephalic Extreme",
  ],
  CAT: [
    "Scottish Fold x Fold (bone issues)",
    "Munchkin x Munchkin (lethal)",
  ],
  HORSE: [
    "Lethal White Overo (O/O)",
    "Double LP (vision issues)",
  ],
  default: ["Lethal genetic combinations"],
};

/**
 * Physical trait suggestions
 */
const PHYSICAL_TRAIT_SUGGESTIONS: Record<string, string[]> = {
  DOG: [
    "Long coat",
    "Short coat",
    "Wire coat",
    "Curly coat",
    "Natural bobtail",
    "Standard tail",
    "Furnishings (beard/eyebrows)",
  ],
  CAT: [
    "Long hair",
    "Short hair",
    "Rex coat (curly)",
    "Hairless",
    "Polydactyl",
  ],
  HORSE: [
    "Draft build",
    "Refined build",
    "Feathering",
    "Roached mane",
  ],
  default: ["Standard coat", "Long coat", "Short coat"],
};

/**
 * Generate a unique ID for goals
 */
function generateGoalId(): string {
  return `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse prediction string to extract probabilities
 * E.g., "50% Black-based, 25% Red-based" -> { "Black-based": 50, "Red-based": 25 }
 */
function parsePredictionProbabilities(prediction: string): Map<string, number> {
  const probs = new Map<string, number>();
  const parts = prediction.split(", ").map((p) => p.trim());

  for (const part of parts) {
    const match = part.match(/^(\d+)%\s+(.+)$/);
    if (match) {
      probs.set(match[2].toLowerCase(), parseInt(match[1], 10));
    }
  }

  return probs;
}

/**
 * Evaluate a single goal against genetic results
 */
function evaluateGoal(
  goal: BreedingGoal,
  results: GeneticsResults | null
): GoalEvaluation {
  if (!results) {
    return {
      goal,
      status: "impossible",
      probability: 0,
      explanation: "No genetic data available for analysis",
    };
  }

  const targetLower = goal.targetValue.toLowerCase();

  // Get relevant predictions based on trait type
  let predictions: (LocusPrediction | HealthPrediction)[] = [];
  switch (goal.traitType) {
    case "coat_color":
      predictions = results.coatColor;
      break;
    case "coat_type":
      predictions = results.coatType;
      break;
    case "health":
      predictions = results.health;
      break;
    case "physical":
      predictions = results.physicalTraits;
      break;
    case "eye_color":
      predictions = results.eyeColor;
      break;
  }

  // For "must_avoid" goals, we want to find if the trait CAN appear
  if (goal.priority === "must_avoid") {
    let foundProbability = 0;
    let foundExplanation = "";
    const relatedPredictions: (LocusPrediction | HealthPrediction)[] = [];

    for (const pred of predictions) {
      const probs = parsePredictionProbabilities(pred.prediction);

      // Check if any outcome matches what we want to avoid
      for (const [outcome, prob] of probs) {
        if (
          outcome.includes(targetLower) ||
          targetLower.includes(outcome) ||
          pred.trait.toLowerCase().includes(targetLower)
        ) {
          foundProbability = Math.max(foundProbability, prob);
          relatedPredictions.push(pred);
        }
      }

      // Special check for warnings
      if (pred.warning && targetLower.includes("double")) {
        foundProbability = Math.max(foundProbability, 25);
        foundExplanation = "Warning: Dangerous genetic combination possible";
        relatedPredictions.push(pred);
      }
    }

    // Check global warnings
    for (const warning of results.warnings) {
      if (warning.message.toLowerCase().includes(targetLower)) {
        foundProbability = Math.max(foundProbability, 50);
        foundExplanation = warning.message;
      }
    }

    // For avoidance goals, 0% probability is good (achievable)
    if (foundProbability === 0) {
      return {
        goal,
        status: "achievable",
        probability: 100,
        explanation: `This trait will not appear in offspring - safe to proceed`,
        relatedPredictions,
      };
    } else if (foundProbability <= 25) {
      return {
        goal,
        status: "possible",
        probability: 100 - foundProbability,
        explanation: foundExplanation || `${foundProbability}% chance of producing this unwanted trait`,
        relatedPredictions,
      };
    } else {
      return {
        goal,
        status: foundProbability >= 75 ? "impossible" : "unlikely",
        probability: 100 - foundProbability,
        explanation: foundExplanation || `HIGH RISK: ${foundProbability}% chance of producing this trait`,
        relatedPredictions,
      };
    }
  }

  // For "must_have" and "nice_to_have" goals
  let bestProbability = 0;
  let bestExplanation = "";
  const relatedPredictions: (LocusPrediction | HealthPrediction)[] = [];

  for (const pred of predictions) {
    const probs = parsePredictionProbabilities(pred.prediction);

    // Check each outcome for matches
    for (const [outcome, prob] of probs) {
      const normalizedOutcome = outcome.toLowerCase();

      // Check for various match patterns
      const isMatch =
        normalizedOutcome.includes(targetLower) ||
        targetLower.includes(normalizedOutcome) ||
        // Handle "clear" vs "affected" for health
        (goal.traitType === "health" &&
          targetLower.includes("clear") &&
          normalizedOutcome.includes("clear")) ||
        (goal.traitType === "health" &&
          !targetLower.includes("carrier") &&
          !targetLower.includes("affected") &&
          normalizedOutcome.includes("clear"));

      if (isMatch) {
        if (prob > bestProbability) {
          bestProbability = prob;
          bestExplanation = `${prob}% chance from ${pred.trait}`;
        }
        relatedPredictions.push(pred);
      }
    }

    // Check trait name matches (for general queries like "solid black")
    if (pred.trait.toLowerCase().includes(targetLower)) {
      const probs = parsePredictionProbabilities(pred.prediction);
      const totalProb = Array.from(probs.values()).reduce((sum, p) => sum + p, 0);
      if (totalProb > bestProbability) {
        bestProbability = totalProb;
        bestExplanation = `Related to ${pred.trait}`;
        relatedPredictions.push(pred);
      }
    }
  }

  // Determine status based on probability
  let status: GoalStatus;
  if (bestProbability >= 75) {
    status = "achievable";
  } else if (bestProbability >= 25) {
    status = "possible";
  } else if (bestProbability > 0) {
    status = "unlikely";
  } else {
    status = "impossible";
  }

  // Adjust for priority
  if (goal.priority === "must_have" && status === "impossible") {
    bestExplanation = `Cannot achieve this goal with current pairing - trait not possible in offspring`;
  } else if (bestProbability === 0) {
    bestExplanation = `No matching outcomes found in genetic predictions`;
  }

  return {
    goal,
    status,
    probability: bestProbability,
    explanation: bestExplanation || `${bestProbability}% probability of achieving this goal`,
    relatedPredictions,
  };
}

/**
 * Status indicator component
 */
function GoalStatusIndicator({
  status,
  probability,
}: {
  status: GoalStatus;
  probability: number;
}) {
  const configs: Record<GoalStatus, { icon: React.ReactNode; color: string; label: string }> = {
    achievable: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
      color: "text-green-600 bg-green-500/10 border-green-500/30",
      label: "Achievable",
    },
    possible: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      color: "text-blue-600 bg-blue-500/10 border-blue-500/30",
      label: "Possible",
    },
    unlikely: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/30",
      label: "Unlikely",
    },
    impossible: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      ),
      color: "text-red-600 bg-red-500/10 border-red-500/30",
      label: "Impossible",
    },
  };

  const config = configs[status];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.color}`}>
      {config.icon}
      <span className="text-sm font-medium">{config.label}</span>
      {probability > 0 && status !== "impossible" && (
        <span className="text-xs opacity-75">({probability}%)</span>
      )}
    </div>
  );
}

/**
 * Priority badge component
 */
function PriorityBadge({ priority }: { priority: GoalPriority }) {
  const configs: Record<GoalPriority, { label: string; color: string }> = {
    must_have: {
      label: "Must Have",
      color: "bg-purple-500/15 text-purple-600 border-purple-500/30",
    },
    nice_to_have: {
      label: "Nice to Have",
      color: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    },
    must_avoid: {
      label: "Must Avoid",
      color: "bg-red-500/15 text-red-600 border-red-500/30",
    },
  };

  const config = configs[priority];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}

/**
 * Goal card component
 */
function GoalCard({
  evaluation,
  onRemove,
  onEdit,
}: {
  evaluation: GoalEvaluation;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const { goal, status, probability, explanation } = evaluation;

  const traitTypeLabels: Record<GoalTraitType, string> = {
    coat_color: "Coat Color",
    coat_type: "Coat Type",
    health: "Health",
    physical: "Physical Trait",
    eye_color: "Eye Color",
  };

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <PriorityBadge priority={goal.priority} />
            <span className="text-xs text-secondary">{traitTypeLabels[goal.traitType]}</span>
          </div>
          <h4 className="font-medium text-primary truncate">{goal.targetValue}</h4>
          {goal.notes && (
            <p className="text-xs text-secondary mt-1 line-clamp-2">{goal.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip content="Edit goal">
            <button
              onClick={onEdit}
              className="p-1.5 text-secondary hover:text-primary hover:bg-hairline rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </Tooltip>
          <Tooltip content="Remove goal">
            <button
              onClick={onRemove}
              className="p-1.5 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <GoalStatusIndicator status={status} probability={probability} />
      </div>

      {explanation && (
        <p className="text-xs text-secondary mt-2 pt-2 border-t border-hairline">{explanation}</p>
      )}
    </div>
  );
}

/**
 * Add goal form component
 */
function AddGoalForm({
  species,
  onAdd,
  onCancel,
  editingGoal,
}: {
  species: string;
  onAdd: (goal: BreedingGoal) => void;
  onCancel: () => void;
  editingGoal?: BreedingGoal | null;
}) {
  const [traitType, setTraitType] = React.useState<GoalTraitType>(
    editingGoal?.traitType || "coat_color"
  );
  const [priority, setPriority] = React.useState<GoalPriority>(
    editingGoal?.priority || "must_have"
  );
  const [targetValue, setTargetValue] = React.useState(editingGoal?.targetValue || "");
  const [notes, setNotes] = React.useState(editingGoal?.notes || "");
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Get suggestions based on trait type and priority
  const getSuggestions = (): string[] => {
    const speciesKey = species?.toUpperCase() || "default";

    if (priority === "must_avoid") {
      return AVOID_SUGGESTIONS[speciesKey] || AVOID_SUGGESTIONS.default;
    }

    switch (traitType) {
      case "coat_color":
        return COAT_COLOR_SUGGESTIONS[speciesKey] || COAT_COLOR_SUGGESTIONS.default;
      case "health":
        return HEALTH_CLEARANCE_SUGGESTIONS[speciesKey] || HEALTH_CLEARANCE_SUGGESTIONS.default;
      case "physical":
      case "coat_type":
        return PHYSICAL_TRAIT_SUGGESTIONS[speciesKey] || PHYSICAL_TRAIT_SUGGESTIONS.default;
      default:
        return [];
    }
  };

  const suggestions = getSuggestions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetValue.trim()) return;

    const goal: BreedingGoal = {
      id: editingGoal?.id || generateGoalId(),
      traitType,
      traitName: traitType,
      targetValue: targetValue.trim(),
      priority,
      notes: notes.trim() || undefined,
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
    };

    onAdd(goal);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border-2 border-accent/30 bg-accent/5 p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-primary">
          {editingGoal ? "Edit Goal" : "Add New Goal"}
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-secondary hover:text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Priority Selection */}
      <div>
        <label className="text-xs font-medium text-secondary block mb-2">Priority</label>
        <div className="flex gap-2">
          {(["must_have", "nice_to_have", "must_avoid"] as GoalPriority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                priority === p
                  ? p === "must_have"
                    ? "bg-purple-500 text-white"
                    : p === "nice_to_have"
                    ? "bg-blue-500 text-white"
                    : "bg-red-500 text-white"
                  : "bg-hairline text-secondary hover:text-primary"
              }`}
            >
              {p === "must_have" ? "Must Have" : p === "nice_to_have" ? "Nice to Have" : "Must Avoid"}
            </button>
          ))}
        </div>
      </div>

      {/* Trait Type Selection */}
      <div>
        <label className="text-xs font-medium text-secondary block mb-2">Trait Type</label>
        <select
          value={traitType}
          onChange={(e) => setTraitType(e.target.value as GoalTraitType)}
          className="w-full h-9 px-3 text-sm border border-hairline rounded-lg bg-surface focus:border-accent focus:ring-1 focus:ring-accent outline-none"
        >
          <option value="coat_color">Coat Color</option>
          <option value="coat_type">Coat Type</option>
          <option value="health">Health Clearance</option>
          <option value="physical">Physical Trait</option>
          <option value="eye_color">Eye Color</option>
        </select>
      </div>

      {/* Target Value Input */}
      <div className="relative">
        <label className="text-xs font-medium text-secondary block mb-2">Target Value</label>
        <input
          type="text"
          value={targetValue}
          onChange={(e) => setTargetValue(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={`e.g., ${suggestions[0] || "Describe the trait..."}`}
          className="w-full h-9 px-3 text-sm border border-hairline rounded-lg bg-surface focus:border-accent focus:ring-1 focus:ring-accent outline-none"
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-surface border border-hairline rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions
              .filter((s) => s.toLowerCase().includes(targetValue.toLowerCase()))
              .map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTargetValue(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-hairline transition-colors"
                >
                  {suggestion}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-medium text-secondary block mb-2">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional context or reasoning..."
          rows={2}
          className="w-full px-3 py-2 text-sm border border-hairline rounded-lg bg-surface focus:border-accent focus:ring-1 focus:ring-accent outline-none resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!targetValue.trim()}
          className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {editingGoal ? "Update Goal" : "Add Goal"}
        </button>
      </div>
    </form>
  );
}

/**
 * Summary panel showing goal achievement overview
 */
function GoalsSummary({ evaluations }: { evaluations: GoalEvaluation[] }) {
  const mustHaveGoals = evaluations.filter((e) => e.goal.priority === "must_have");
  const niceToHaveGoals = evaluations.filter((e) => e.goal.priority === "nice_to_have");
  const mustAvoidGoals = evaluations.filter((e) => e.goal.priority === "must_avoid");

  const mustHaveAchievable = mustHaveGoals.filter((e) => e.status === "achievable" || e.status === "possible").length;
  const niceToHaveAchievable = niceToHaveGoals.filter((e) => e.status === "achievable" || e.status === "possible").length;
  const mustAvoidSafe = mustAvoidGoals.filter((e) => e.status === "achievable").length;

  const allMustHavesMet = mustHaveGoals.length === 0 || mustHaveAchievable === mustHaveGoals.length;
  const allAvoidancesSafe = mustAvoidGoals.length === 0 || mustAvoidSafe === mustAvoidGoals.length;
  const overallRecommendation = allMustHavesMet && allAvoidancesSafe;

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
      <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Goal Progress Summary
      </h4>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Must Have Progress */}
        <div className="text-center p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
          <div className="text-2xl font-bold text-purple-600">
            {mustHaveGoals.length > 0 ? `${mustHaveAchievable}/${mustHaveGoals.length}` : "-"}
          </div>
          <div className="text-xs text-secondary">Must Have</div>
        </div>

        {/* Nice to Have Progress */}
        <div className="text-center p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <div className="text-2xl font-bold text-blue-600">
            {niceToHaveGoals.length > 0 ? `${niceToHaveAchievable}/${niceToHaveGoals.length}` : "-"}
          </div>
          <div className="text-xs text-secondary">Nice to Have</div>
        </div>

        {/* Must Avoid Progress */}
        <div className="text-center p-3 rounded-lg bg-red-500/5 border border-red-500/20">
          <div className="text-2xl font-bold text-red-600">
            {mustAvoidGoals.length > 0 ? `${mustAvoidSafe}/${mustAvoidGoals.length}` : "-"}
          </div>
          <div className="text-xs text-secondary">Safe Avoids</div>
        </div>
      </div>

      {/* Overall Recommendation */}
      <div
        className={`flex items-center gap-3 p-3 rounded-lg ${
          overallRecommendation
            ? "bg-green-500/10 border border-green-500/30"
            : "bg-yellow-500/10 border border-yellow-500/30"
        }`}
      >
        {overallRecommendation ? (
          <>
            <svg className="w-6 h-6 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <div className="font-medium text-green-700 dark:text-green-400">Good Pairing Match</div>
              <div className="text-xs text-green-600 dark:text-green-500">
                This pairing aligns well with your breeding goals
              </div>
            </div>
          </>
        ) : (
          <>
            <svg className="w-6 h-6 text-yellow-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <div className="font-medium text-yellow-700 dark:text-yellow-400">Review Recommended</div>
              <div className="text-xs text-yellow-600 dark:text-yellow-500">
                Some goals may not be achievable with this pairing
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Main Breeding Goal Planner Component
 */
export default function BreedingGoalPlanner({
  geneticsResults: geneticsResultsProp,
  results,
  savedGoals: savedGoalsProp,
  species = "DOG",
  damName,
  sireName,
  onGoalsChange,
  className = "",
}: BreedingGoalPlannerProps) {
  // Support both geneticsResults and results props
  const geneticsResults = geneticsResultsProp || results || null;

  // Internal state for goals when not controlled
  const [internalGoals, setInternalGoals] = React.useState<BreedingGoal[]>([]);
  const savedGoals = savedGoalsProp ?? internalGoals;
  const handleGoalsChange = onGoalsChange ?? setInternalGoals;

  const [isAddingGoal, setIsAddingGoal] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<BreedingGoal | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<GoalPriority | "all">("all");

  // Evaluate all goals against current genetics
  const evaluations = React.useMemo(() => {
    return (savedGoals || []).map((goal) => evaluateGoal(goal, geneticsResults));
  }, [savedGoals, geneticsResults]);

  // Filter evaluations by category
  const filteredEvaluations = React.useMemo(() => {
    if (activeCategory === "all") return evaluations;
    return evaluations.filter((e) => e.goal.priority === activeCategory);
  }, [evaluations, activeCategory]);

  const handleAddGoal = (goal: BreedingGoal) => {
    if (editingGoal) {
      // Update existing goal
      const updated = savedGoals.map((g) => (g.id === goal.id ? goal : g));
      handleGoalsChange(updated);
    } else {
      // Add new goal
      handleGoalsChange([...savedGoals, goal]);
    }
    setIsAddingGoal(false);
    setEditingGoal(null);
  };

  const handleRemoveGoal = (goalId: string) => {
    handleGoalsChange(savedGoals.filter((g) => g.id !== goalId));
  };

  const handleEditGoal = (goal: BreedingGoal) => {
    setEditingGoal(goal);
    setIsAddingGoal(true);
  };

  const getCategoryCounts = () => {
    const counts = { all: savedGoals.length, must_have: 0, nice_to_have: 0, must_avoid: 0 };
    for (const goal of savedGoals) {
      counts[goal.priority]++;
    }
    return counts;
  };

  const counts = getCategoryCounts();

  return (
    <div className={`rounded-xl border-2 border-accent/30 bg-surface p-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="text-2xl">&#x1F3AF;</span>
            Breeding Goal Planner
          </h3>
          <p className="text-xs text-secondary mt-0.5">
            {damName && sireName
              ? `Evaluating goals for ${damName} x ${sireName}`
              : "Set and track breeding goals for genetic outcomes"}
          </p>
        </div>

        {!isAddingGoal && (
          <button
            onClick={() => {
              setEditingGoal(null);
              setIsAddingGoal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Goal
          </button>
        )}
      </div>

      {/* Add/Edit Goal Form */}
      {isAddingGoal && (
        <div className="mb-4">
          <AddGoalForm
            species={species}
            onAdd={handleAddGoal}
            onCancel={() => {
              setIsAddingGoal(false);
              setEditingGoal(null);
            }}
            editingGoal={editingGoal}
          />
        </div>
      )}

      {/* Summary Panel */}
      {savedGoals.length > 0 && geneticsResults && (
        <div className="mb-4">
          <GoalsSummary evaluations={evaluations} />
        </div>
      )}

      {/* Category Filter Tabs */}
      {savedGoals.length > 0 && (
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-hairline overflow-x-auto">
          {(["all", "must_have", "nice_to_have", "must_avoid"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-accent text-white"
                  : "bg-hairline text-secondary hover:text-primary"
              }`}
            >
              {cat === "all"
                ? "All"
                : cat === "must_have"
                ? "Must Have"
                : cat === "nice_to_have"
                ? "Nice to Have"
                : "Must Avoid"}
              <span className="ml-1.5 text-xs opacity-75">({counts[cat]})</span>
            </button>
          ))}
        </div>
      )}

      {/* Goals Grid */}
      {filteredEvaluations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredEvaluations.map((evaluation) => (
            <GoalCard
              key={evaluation.goal.id}
              evaluation={evaluation}
              onRemove={() => handleRemoveGoal(evaluation.goal.id)}
              onEdit={() => handleEditGoal(evaluation.goal)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-secondary">
          <div className="text-4xl mb-3">&#x1F3AF;</div>
          <p className="text-sm">
            {savedGoals.length === 0
              ? "No breeding goals set yet. Click \"Add Goal\" to get started."
              : `No goals in this category`}
          </p>
          <p className="text-xs mt-2 text-secondary/80">
            Set goals to track progress toward specific genetic outcomes
          </p>
        </div>
      )}

      {/* No genetics data warning */}
      {savedGoals.length > 0 && !geneticsResults && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-start gap-2 text-yellow-700 dark:text-yellow-400">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <div className="font-medium">No Genetic Data Available</div>
              <div className="text-xs mt-0.5">
                Select a dam and sire with genetic profiles to evaluate your breeding goals.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-generational Planning Tip */}
      <div className="mt-4 pt-4 border-t border-hairline">
        <div className="flex items-start gap-2 text-xs text-secondary">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>
            <strong>Planning Multiple Generations?</strong> Goals marked as "impossible" with this
            pairing may become achievable through strategic outcrossing. Consider which traits can
            be introduced from outside lines.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage breeding goals with localStorage persistence
 */
export function useBreedingGoals(storageKey: string = "bhq-breeding-goals") {
  const [goals, setGoals] = React.useState<BreedingGoal[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(goals));
    } catch (e) {
      console.warn("Failed to persist breeding goals to localStorage", e);
    }
  }, [goals, storageKey]);

  return [goals, setGoals] as const;
}

/**
 * Export types and utilities for use elsewhere
 */
export {
  evaluateGoal,
  parsePredictionProbabilities,
  generateGoalId,
  COAT_COLOR_SUGGESTIONS,
  HEALTH_CLEARANCE_SUGGESTIONS,
  AVOID_SUGGESTIONS,
  PHYSICAL_TRAIT_SUGGESTIONS,
};
