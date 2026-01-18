# User Education Wizard - Implementation Documentation

## Overview

The User Education Wizard is a multi-step onboarding wizard that educates breeders about the Ovulation Anchor Breeding System. It adapts content based on species using the existing `getSpeciesTerminology()` system.

## File Structure

```
packages/ui/src/components/EducationWizard/
├── index.ts                      # Public exports
├── EducationWizard.tsx           # Main wizard container (uses Dialog)
├── WizardProgress.tsx            # Step progress indicator
├── WizardStep.tsx                # Individual step wrapper
├── hooks/
│   └── useWizardCompletion.ts    # localStorage persistence
└── steps/
    ├── WelcomeStep.tsx           # Introduction
    ├── AnchorModesStep.tsx       # What are anchor modes
    ├── TestingBenefitsStep.tsx   # How testing improves accuracy
    ├── UpgradePathStep.tsx       # When/how to upgrade
    ├── SpeciesGuidanceStep.tsx   # Species-specific guidance
    └── SummaryStep.tsx           # Recap with actions
```

## Component Architecture

### EducationWizard.tsx
Main container component that orchestrates the wizard flow.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Whether the wizard is open |
| `onClose` | `() => void` | Called when the wizard should close |
| `species` | `SpeciesCode` | The species to show content for |
| `onComplete` | `() => void` | Called when the user completes the wizard |
| `onDismiss` | `() => void` | Called when the user dismisses (don't show again) |

**Features:**
- Uses existing `Dialog` component with `size="lg"`
- Manages step navigation internally
- Footer with "Don't show again" checkbox + Next/Back buttons
- Automatically filters steps based on species capabilities

### WizardProgress.tsx
Horizontal step indicator showing progress through the wizard.

**States:**
- Completed: Green checkmark
- Current: Amber with ring highlight
- Upcoming: Gray with number

### useWizardCompletion Hook
Manages localStorage persistence for wizard completion state.

**Storage Key:** `bhq_anchor_education`

**State Shape:**
```typescript
interface WizardState {
  completed: boolean;
  dismissed: boolean;
  completedAt?: string;
  species?: string;
}
```

**Hook Return:**
```typescript
interface UseWizardCompletionResult {
  shouldShow: boolean;      // Whether to show the wizard
  isCompleted: boolean;     // Whether wizard was completed
  isDismissed: boolean;     // Whether wizard was dismissed
  markCompleted: (species?: string) => void;
  markDismissed: () => void;
  reset: () => void;        // For testing/re-education
}
```

## Step Filtering Logic

The wizard shows different steps based on species reproductive characteristics:

### Step Definitions

| Step | Content | Purpose |
|------|---------|---------|
| 1. Welcome | Introduction to anchor modes | Always shown |
| 2. Anchor Modes | CYCLE_START, OVULATION, BREEDING_DATE explained | Always shown |
| 3. Testing Benefits | Accuracy improvement (±2-3 days → ±1 day) | Only for testable species |
| 4. Upgrade Path | When/how to upgrade from cycle to ovulation | Only for species that support upgrade |
| 5. Species Guidance | Deep dive using terminology system | Always shown |
| 6. Summary | Recap + "Got it!" action | Always shown |

### Species Categories

| Category | Species | Steps Shown | Reason |
|----------|---------|-------------|--------|
| **Testable** | DOG, HORSE | All 6 steps | Can test for ovulation and upgrade anchor |
| **Induced Ovulators** | CAT, RABBIT, ALPACA, LLAMA | Skip step 4 | Ovulate when bred, no upgrade path exists |
| **Observation-Only** | GOAT, SHEEP, PIG, CATTLE, CHICKEN | Skip steps 3 & 4 | No testing infrastructure available |

### Filtering Implementation

```typescript
function getStepsForSpecies(species: SpeciesCode): Step[] {
  const { testingAvailable, supportsUpgrade } = terminology.anchorMode;

  return ALL_STEPS.filter(step => {
    // Always show: welcome, anchors, species, summary
    if (["welcome", "anchors", "species", "summary"].includes(step.key)) {
      return true;
    }
    // Testing benefits: only if testing available
    if (step.key === "testing") return testingAvailable;
    // Upgrade path: only if upgrade supported
    if (step.key === "upgrade") return supportsUpgrade;
    return true;
  });
}
```

## Trigger Points

### 1. First Lock (Primary)
When user first locks a breeding plan and hasn't completed/dismissed the wizard:

```typescript
// In App-Breeding.tsx lockCycle()
if (shouldShowEducationWizard) {
  setShowEducationWizard(true);
  // Continue with lock - wizard is informational, not blocking
}
```

### 2. Help Button (Secondary)
Help icon next to "Breeding Cycle Selection" section header allows users to access the wizard anytime:

```tsx
<Tooltip content="Learn about anchor modes and timing">
  <button onClick={() => setShowEducationWizard(true)}>
    <InfoIcon />
  </button>
</Tooltip>
```

## Integration in App-Breeding.tsx

### Imports Added
```typescript
import {
  EducationWizard,
  useWizardCompletion,
} from "@bhq/ui";
```

### State Setup
```typescript
// Education wizard state
const [showEducationWizard, setShowEducationWizard] = React.useState(false);
const {
  shouldShow: shouldShowEducationWizard,
  markCompleted: markWizardCompleted,
  markDismissed: markWizardDismissed
} = useWizardCompletion();
```

### Render
```tsx
<EducationWizard
  open={showEducationWizard}
  onClose={() => setShowEducationWizard(false)}
  species={(effective.species?.toUpperCase() || "DOG") as SpeciesCode}
  onComplete={() => markWizardCompleted(effective.species?.toUpperCase())}
  onDismiss={markWizardDismissed}
/>
```

## Species Terminology Integration

All step components use the `getSpeciesTerminology()` function to display species-appropriate content:

```typescript
const terminology = getSpeciesTerminology(species);

// Access species-specific data
terminology.birth.processCap        // "Whelping", "Foaling", etc.
terminology.cycle.startLabelCap     // "Heat Start", "Cycle Start", etc.
terminology.anchorMode.options      // Available anchor options
terminology.anchorMode.guidanceText // Species-specific guidance
terminology.ovulation.testingGuidance // When/how to test
```

## User Experience Flow

1. User creates a breeding plan
2. User selects a dam and cycle
3. User clicks lock button for the first time
4. Education Wizard opens automatically
5. User navigates through species-appropriate steps
6. User can check "Don't show again" to prevent future popups
7. User clicks "Got it!" to complete
8. Lock operation proceeds
9. Help icon remains available for future reference

## Testing Considerations

### Manual Testing Checklist
1. Test wizard flow for DOG (all 6 steps)
2. Test wizard flow for CAT (skip step 4)
3. Test wizard flow for GOAT (skip steps 3 & 4)
4. Verify "Don't show again" persists across page reloads
5. Verify help button opens wizard after dismissal
6. Verify mobile responsiveness
7. Test keyboard navigation (Tab, Enter, Escape)

### Reset for Testing
To reset the wizard state for testing:
```javascript
localStorage.removeItem('bhq_anchor_education');
```

Or use the hook's reset function:
```typescript
const { reset } = useWizardCompletion();
reset(); // Clears localStorage and resets state
```

## Related Documentation
- [08-ui-ux-specification-by-species.md](08-ui-ux-specification-by-species.md) - Species-specific UI designs
- [speciesTerminology.ts](../../packages/ui/src/utils/speciesTerminology.ts) - Terminology system
