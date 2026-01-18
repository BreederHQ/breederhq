# UI Flow: PlanJourney Component

## Overview

The `PlanJourney` component is the primary interface for managing a breeding plan through its complete lifecycle. At 67KB, it's the largest component in the breeding module and orchestrates the entire user experience.

**Location:** `apps/breeding/src/components/PlanJourney.tsx`

## Visual Design

### Timeline Header

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│   ●─────●─────●─────◐─ ─ ─○─ ─ ─○─ ─ ─○─ ─ ─○                                       │
│   1     2     3     4       5       6       7       8                                │
│                                                                                      │
│  Planning  Committed  Bred  Birthed  Weaned  Placement  Placement  Complete          │
│                                              Started    Completed                    │
└─────────────────────────────────────────────────────────────────────────────────────┘

Legend:
●  = Completed (green with checkmark)
◐  = Current (amber with pulsing ring)
○  = Future (gray outline)
── = Solid line (completed segment)
─ ─ = Dashed line (future segment)
```

### Phase Indicators

Each phase circle has visual states:

| State | Appearance |
|-------|------------|
| Completed | Green (#10B981) with white checkmark |
| Current | Amber (#F59E0B) with pulsing ring animation |
| Next | Amber outline with subtle pulse |
| Future | Gray (#6B7280) outline, inactive |

### Connecting Lines

| Segment | Style |
|---------|-------|
| Completed | Solid green line |
| Current→Next | Animated dashed line ("marching ants") |
| Future | Gray dashed line |

## Component Structure

### Main Layout

```tsx
<PlanJourney>
  ├── Timeline Header
  │   ├── Phase Circles (1-8)
  │   └── Connecting Lines
  │
  ├── Guidance Section (collapsible)
  │   ├── Header with toggle
  │   ├── Phase-specific guidance text
  │   └── Requirements checklist
  │
  ├── Action Area
  │   ├── Date input cards
  │   ├── Advance button
  │   └── Quick actions
  │
  └── Celebration Overlay (Phase 7 completion)
```

### Collapsed vs Expanded Mode

**Collapsed Mode:**
- Minimal footprint
- Shows incomplete task count
- Inline date pickers for current requirement only
- Quick summary of what's needed

**Expanded Mode:**
- Full phase-specific guidance text
- Complete requirements checklist
- Detailed explanations
- All relevant date inputs visible

Toggle via header button or `guidanceCollapsed` prop.

## Phase-by-Phase UI

### Phase 1: PLANNING

**Header:** "Set Up Your Breeding Plan"

**Checklist:**
- [ ] Plan Name
- [ ] Species
- [ ] Dam (female)
- [ ] Sire (male)
- [ ] Breed
- [ ] Locked Cycle Start

**Guidance Text:**
> "Select your breeding pair and lock in your estimated dates. You can use the Genetics Lab to analyze potential pairings before committing."

**Special UI:**
- Genetics Lab link prominent
- Dam/Sire selection dropdowns
- Cycle date picker with species-aware defaults

**Advance Button:** "Commit Plan" (triggers confirmation modal)

---

### Phase 2: COMMITTED

**Header:** "Prepare for Breeding"

**Checklist:**
- [x] Plan committed on {date}
- [ ] Actual Cycle Start Date

**Guidance Text:**
> "Your plan is locked. Watch for heat signs and record the actual cycle start date when observed. {Species-specific cycle observation tips}"

**Special UI:**
- Countdown to expected cycle (if available)
- Quick link to upgrade to ovulation testing
- Hormone testing date input (optional)

**Advance Button:** "Record Cycle Start"

---

### Phase 3: BRED

**Header:** "Monitor Pregnancy"

**Checklist:**
- [x] Cycle started on {date}
- [x] Bred on {date}
- [ ] Actual Birth Date

**Guidance Text:**
> "Breeding complete! The expected birth date is {date}. Monitor closely and record the birth when it occurs."

**Special UI (Horses):**
- Foaling milestone checklist
- Countdown to due date
- Pregnancy check recording

**Advance Button:** "Record Birth"

---

### Phase 4: BIRTHED

**Header:** "Early Offspring Care"

**Checklist:**
- [x] Birth on {date}
- [x] Offspring count: {n} born
- [ ] Actual Weaned Date

**Guidance Text:**
> "Congratulations on {offspring terminology}! Focus on early care and monitoring. Visit the Offspring page to record individual details."

**Special UI:**
- Link to Offspring page (prominent)
- Quick offspring count summary
- Health status indicators (horses)

**Species-Specific Notes:**
| Species | Note |
|---------|------|
| HORSE | "Record foaling outcome and monitor foal health closely" |
| DOG | "Puppies will begin weaning around week 3-4" |
| CAT | "Kittens can start solid food around 3-4 weeks" |

**Advance Button:** "Record Weaning"

---

### Phase 5: WEANED

**Header:** "Prepare for Placement"

**Checklist:**
- [x] Weaned on {date}
- [ ] Actual Placement Start Date

**Guidance Text:**
> "Offspring are weaned and ready for placement preparation. Work with your waitlist to assign {offspring terminology} to families."

**Special UI:**
- Waitlist summary
- Buyer assignments status
- Health check completion tracker

**Call to Action:**
> "Visit the **Offspring** page to manage buyer assignments and prepare for placement."

**Advance Button:** "Begin Placement"

---

### Phase 6: PLACEMENT_STARTED

**Header:** "Placement in Progress"

**Checklist:**
- [x] Placement started on {date}
- [ ] Actual Placement Completed Date

**Status Display:**
- X of Y offspring placed
- Progress bar
- Individual offspring status

**Guidance Text:**
> "Coordinate with families for pickup. Complete health documentation and contracts before release."

**Advance Button:** "Complete Placement"

---

### Phase 7: PLACEMENT_COMPLETED

**Header:** "Finalize Breeding Plan"

**🎉 Celebration Card:**
When all offspring are placed, a celebration card appears with:
- Confetti animation
- Success message
- Final statistics

**Pre-Completion Checklist:**
- [ ] Health records entered for each offspring
- [ ] Client contracts signed
- [ ] Invoices completed
- [ ] Media uploaded

**Guidance Text:**
> "All offspring placed! Complete any remaining administrative tasks to officially close this breeding."

**Advance Button:** "Complete Plan"

---

### Phase 8: COMPLETE

**Header:** "Breeding Complete"

**Final Summary:**
- Timeline recap
- Key dates
- Offspring summary
- Financial summary

**UI State:**
- All fields read-only
- Archive option available
- Link to generate reports

## Date Entry Patterns

### Date Input Card

```
┌────────────────────────────────────────┐
│ Actual Birth Date                      │
│ ┌──────────────────────────────────┐  │
│ │ 📅  Select date...               │  │
│ └──────────────────────────────────┘  │
│ Expected: January 15, 2026             │
└────────────────────────────────────────┘
```

### Completed Date Display

```
┌────────────────────────────────────────┐
│ ✓ Actual Birth Date                    │
│   January 12, 2026                     │
│   [Change]                             │
└────────────────────────────────────────┘
```

### Change Flow

1. User clicks "Change" button
2. Date field clears to input mode
3. User enters new date
4. Validation against immutability rules
5. Update saved or error displayed

## Props Interface

```typescript
interface PlanJourneyProps {
  // Current status
  status: BreedingPlanStatus;

  // Requirement flags
  hasName: boolean;
  hasSpecies: boolean;
  hasDam: boolean;
  hasSire: boolean;
  hasBreed: boolean;
  hasLockedCycle: boolean;

  // Date values (actual)
  cycleStartDateActual?: string;
  hormoneTestingStartDateActual?: string;
  breedDateActual?: string;
  birthDateActual?: string;
  weanedDateActual?: string;
  placementStartDateActual?: string;
  placementCompletedDateActual?: string;
  completedDateActual?: string;

  // Date values (expected, for calendar defaults)
  expectedCycleStart?: string;
  expectedBirthDate?: string;
  expectedWeaned?: string;
  expectedPlacementStart?: string;
  expectedPlacementCompleted?: string;

  // Offspring info
  offspringCount?: number;
  offspringPlaced?: number;

  // Species for terminology
  species: Species;

  // Callbacks
  onAdvancePhase: (nextPhase: BreedingPlanStatus) => void;
  onDateChange: (field: string, value: string | null) => void;
  onNavigateToTab: (tab: string) => void;

  // UI control
  guidanceCollapsed: boolean;
  onToggleGuidance: () => void;
  isEdit: boolean;

  // Modal confirmation
  confirmModal: (config: ConfirmModalConfig) => Promise<boolean>;
}
```

## Animations & Visual Feedback

### Pulsing Effects

```css
/* Current phase indicator */
@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
}

/* Advance button attention */
@keyframes button-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
}
```

### Marching Ants

```css
/* Current segment connecting line */
@keyframes marching-ants {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 20; }
}
```

### Confetti Celebration

When Phase 7 (PLACEMENT_COMPLETED) is reached:
1. Celebration card slides in
2. Confetti particles animate from top
3. Success sound plays (if enabled)
4. Card remains until user advances

## Edit Mode Behavior

### Edit Mode Enabled (`isEdit: true`)

- Date input fields visible
- "Change" buttons visible on completed dates
- "Advance to..." button enabled
- Checklist items interactive

### View Mode (`isEdit: false`)

- Dates shown as read-only text
- No "Change" buttons
- Message: "Click Edit to advance this plan"
- Checklist shows status only

## Color Scheme

| Element | Color | Tailwind |
|---------|-------|----------|
| Completed | Green | `emerald-500` (#10B981) |
| Current/Action | Amber | `amber-500` (#F59E0B) |
| Guidance Highlights | Gold | `#fbbf24` |
| Future/Inactive | Gray | `gray-400` (#9CA3AF) |
| Error | Red | `red-500` (#EF4444) |
| Purple Guidance | Purple | `purple-400` (#A78BFA) |

## Responsive Behavior

- Desktop: Full horizontal timeline
- Tablet: Compressed timeline, full guidance
- Mobile: Vertical stepper layout

## Accessibility

- All interactive elements have focus states
- Color contrast meets WCAG AA
- Screen reader announcements for phase changes
- Keyboard navigation through timeline
- ARIA labels on all icons

