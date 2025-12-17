# CLAUDE.md - BreederHQ Project Context

## Project Overview

BreederHQ is a multi-module web platform for animal breeders. It's a monorepo with shared UI utilities and per-app pages, currently running as a "seeded local demo" with localStorage-based persistence.

### Core Modules
- **Animals** - Animal records, genealogy, reproduction history
- **Contacts** - Contact management
- **Breeding** - Three sub-tabs: Plans, Calendar, Planner
- **Offspring** - (In development)

### Tech Stack
- React + TypeScript
- Vite for build/dev
- Tailwind CSS
- localStorage for persistence (mock/demo layer)
- Single-file "app screen" pattern for pages

### Related Repos (in workspace)
- **breederhq-api** - Backend API (sibling folder). See its CLAUDE.md for endpoint details, Prisma schema, and business rules.
- **bhq-mock** - Legacy mock server (Archive). Likely deprecated.

### Frontend ↔ Backend Integration
- API SDK lives in `packages/api/src/`
- Types shared via `packages/api/src/types/`
- HTTP client in `packages/api/src/http.ts`
- **Important:** Backend is authoritative for breeding math, locked cycles, and permissions. Frontend visualizes but does not decide.

---

## Architecture

### Data Sharing Strategy
Modules share state through **localStorage keys** and **custom window events**. This is the current "API" between modules.

### Routing (Breeding Module)
The `BreedingModule.tsx` handles tab routing with this priority:
1. Router state (`location.state.tab`)
2. localStorage (`bhq_tab`)
3. Default: `"plans"`

Writes chosen tab back to `bhq_tab` on change.

---

## localStorage Key Inventory (TREAT AS PUBLIC API)

### Breeding
| Key | Purpose |
|-----|---------|
| `bhq_tab` | Selected breeding tab |
| `bhq_plans` | Plans list (Plans page) |
| `bhq:breeding:plans` | Plans list (preferred key for Planner) |
| `breedingPlans` | Plans list (legacy fallback) |
| `bhq_breeding_q` | Plans page search term |
| `bhq_plan_cols_v2` | Plans table column chooser |

**Custom Event:** `bhq:breeding:plans:updated` - Planner listens for same-tab updates

### Animals
| Key | Purpose |
|-----|---------|
| `bhq_animals` | Animals list (shared to other modules) |
| `bhq_animals_cols_v1` | Column chooser state |
| `bhq_animals_sorts_v1` | Sort state |
| `bhq_animals_filters_v1` | Filter state |
| `bhq_animals_pagesize_v1` | Page size |
| `bhq_animals_drawertab_v1` | Drawer tab state |

### Contacts
| Key | Purpose |
|-----|---------|
| `bhq_contact_view` | View persistence (columns, sorts, search) |

---

## Breeding Module Deep Dive

### BreedingPlanner Sync Rules
Loads plans from localStorage in this order:
1. `bhq:breeding:plans` (preferred)
2. `bhq_plans` (legacy/alt)
3. `breedingPlans` (fallback)

Stays in sync via:
- Browser `storage` event (cross-tab)
- Custom `bhq:breeding:plans:updated` event (same-tab)
- `focus` and `visibilitychange` events (safety net)

**When saving plans, always:**
```javascript
localStorage.setItem("bhq:breeding:plans", JSON.stringify(plans));
localStorage.setItem("bhq_plans", JSON.stringify(plans)); // compatibility
window.dispatchEvent(new Event("bhq:breeding:plans:updated"));
```

### Plans Page Data Model
The table reads these fields directly from plan objects:
- `lockedCycle.cycleStart`
- `lockedCycle.ovulation`
- `lockedCycle.due` or `expected_due`
- `lockedCycle.goHome` or `expected_go_home`

### Cycle Option Generation
When extracting cycles from a female, the code normalizes from multiple possible field names:
- `cycleStart` ← `c.cycleStart | c.start | c.heatStart | c.begin`
- `ovulation` ← `c.ovulation | c.breedDate | addDays(cycleStart, 12)`
- `due` ← `c.due | c.expectedBirth | c.birth`
- `goHome` ← `c.goHome | c.expectedGoHome | c.go_home`

### Calendar Expected Window Logic
`computePlanExpected(p, female)` derives timeline windows:

**cycleStart resolution:**
1. `p.anchorCycleStartISO`
2. `p.cycleStart`
3. `p.lockedCycle.cycleStart`

**ovulation resolution:**
1. `p.anchorBreedISO`
2. `cycleStart + ovFromStart`
3. `p.lockedCycle.ovulation`

Then computes: hormone testing window → breeding window → due date → weaning → go-home

---

## Animals Data Model (Fields Used by Breeding)

```typescript
interface Animal {
  owners: Owner[];           // multi-ownership
  ownerName: string;         // quick reference
  repro: ReproEvent[];       // reproduction history (heat starts for females)
  last_heat?: string;        // quick UI reference
  sireId?: string;
  damId?: string;
  litterDate?: string;
  litterCode?: string;
  // plus audit trail and documents arrays
}
```

---

## Breeding Domain Logic Defaults (Gantt/Schedule Math)

These are hard requirements for visualizations:

### Biology Math (Dog Defaults)
- `cycle_len_days = 180`
- `start_buffer_days = 14`
- `ovulation_day_from_heat_start = 12`

### Stage Order (Top to Bottom)
1. Pre-breeding Heat
2. Hormone Testing
3. Breeding
4. Whelping
5. Puppy Care
6. Go Home, Normal
7. Go Home, Extended

### Window Rules
- **Pre-breeding full:** earliest_heat_start → latest_heat_start + ovulation_day − 1
- **Hormone Testing full:** earliest_heat_start + 7 → latest_ovulation
- **Breeding full:** earliest_heat_start + (ovulation_day − 1) → latest_heat_start + (ovulation_day + 2)
- **Whelping full:** ovulation +63 ±2
- **Puppy Care full:** whelp_full_start → whelp_full_end + 8 weeks
- **Go Home Normal full:** earliest_whelp_start + 8 weeks → latest_whelp_end + 8 weeks
- **Go Home Extended full:** contiguous +3 weeks after Normal

### Visualization Rules
- Horizon: 18 months
- Unique base colors per stage
- "Most likely" overlays: transparent with black hatch over base color
- Go Home Extended: no likely overlay
- Inclusive end-date math for all bars
- X-axis: "Jan 26'" format, monthly major ticks, weekly hash marks
- Dashed red "Today" line (no label)
- Travel bands for risky/unlikely periods

---

## Known Issues / Active Problem Areas

The Breeding module is migrating from legacy `breedingMath` to `reproEngine`. Recent breakage symptoms:

1. **Plans in COMMITTED/COMPLETED failing to open** - Missing `computeFromLocked` or `expectedMilestonesFromLocked` export
2. **Calendar events not plotting** - Window derivation fails when `plan.stages` is undefined
3. **Overview tab not reflecting selected cycle** - Shows "Cycle Not Yet Selected" after save

### Fix Direction
- Normalize plan shapes at boundaries (reading from storage/API)
- Ensure `lockedCycle` and `expected_*` fields exist consistently
- When saving cycle selection, write to ALL fields the views expect:
  - `lockedCycle.cycleStart`, `.ovulation`, `.due`, `.goHome`
  - `anchorCycleStartISO`, `anchorBreedISO` (if Calendar needs them)
- Use correct storage keys + emit `bhq:breeding:plans:updated`

---

## Code Conventions

### Patterns to Match
- `useMemo` for derived filtered/sorted datasets
- `useEffect` for localStorage persistence
- Defensive parsing: `try/catch` around `JSON.parse`
- Column chooser pattern (Plans, Animals)
- Multi-sort with Shift key (Contacts pattern)
- CSV export utilities exist; Animals forces ID + Microchip in exports

### Modal/Popover Pattern
- Modals: centered, fixed overlay
- Popovers: fixed "outside click overlay" div + close button

---

## Rules for Editing/Refactoring

### DO
- Treat localStorage keys as public API
- Add backward-compatible readers when changing keys (like Planner's multi-key loader)
- Normalize at boundaries with a `normalizePlans()` function that:
  - Ensures `lockedCycle` exists when cycle is selected
  - Ensures `expected_due`/`expected_go_home` are filled when `lockedCycle` has values
  - Ensures female labels/IDs are resolvable against animals list
- When saving plans: write both `bhq:breeding:plans` AND `bhq_plans`, dispatch event

### DON'T
- Break the localStorage key contracts
- Introduce new date fields without bridging them to existing consumers
- Change plan shape without updating all readers (Plans table, Calendar, Planner)

---

## Quick Reference: What Each View Needs

| View | Required Plan Fields | Required External Data |
|------|---------------------|----------------------|
| Plans Table | `lockedCycle.*`, `expected_*` | - |
| Calendar | `anchorCycleStartISO`, `anchorBreedISO`, `lockedCycle.*` | `bhq_animals` (for female + species) |
| Planner | Plans from any recognized key | - |

---

## File Structure

```
breederhq/
├── apps/                           # Module apps (each is a Vite + React app)
│   ├── admin/                      # Admin module
│   │   └── src/
│   │       ├── App-Admin.tsx
│   │       ├── api.ts
│   │       └── routes.tsx
│   │
│   ├── animals/                    # Animals module
│   │   └── src/
│   │       ├── App-Animals.tsx     # Main animals page (single-file app screen)
│   │       ├── api.ts
│   │       └── routes.tsx
│   │
│   ├── breeding/                   # Breeding module (Plans, Calendar, Planner)
│   │   └── src/
│   │       ├── App-Breeding.tsx    # Entry point / BreedingModule
│   │       ├── api.ts
│   │       ├── adapters/           # Data transformation layer
│   │       │   ├── ganttShared.ts
│   │       │   ├── planToEvents.ts
│   │       │   ├── planToGantt.ts
│   │       │   └── planWindows.ts
│   │       └── components/
│   │           ├── BreedingCalendar.tsx
│   │           ├── PerPlanGantt.tsx
│   │           ├── PlannerSwitch.tsx
│   │           └── RollupGantt.tsx
│   │
│   ├── contacts/                   # Contacts module
│   │   └── src/
│   │       ├── App-Contacts.tsx    # Main contacts page
│   │       ├── api.ts
│   │       └── routes.tsx
│   │
│   ├── finance/                    # Finance module
│   │   └── src/
│   │       └── App-Finance.tsx
│   │
│   ├── offspring/                  # Offspring module
│   │   └── src/
│   │       ├── App-Offspring.tsx
│   │       ├── api.ts
│   │       └── pages/
│   │           ├── OffspringPage.tsx
│   │           └── WaitlistPage.tsx
│   │
│   ├── organizations/              # Organizations module
│   │   └── src/
│   │       └── App-Organizations.tsx
│   │
│   └── platform/                   # Platform shell / dashboard
│       └── src/
│           ├── App-Platform.tsx
│           ├── api.ts
│           ├── components/
│           │   ├── ActivityFeed.tsx
│           │   ├── KpiPanel.tsx
│           │   ├── MiniGantt90.tsx
│           │   ├── ProgramProfileSnapshot.tsx
│           │   ├── TodayStrip.tsx
│           │   └── UrgentTasks.tsx
│           ├── features/
│           │   └── useDashboardData.ts
│           └── pages/
│               ├── AccountManagement.tsx
│               ├── Dashboard.tsx
│               ├── InviteSignupPage.tsx
│               ├── LoginPage.tsx
│               ├── SettingsPanel.tsx
│               └── VerifyPage.tsx
│
├── packages/                       # Shared packages
│   ├── api/                        # API SDK (shared HTTP client + resource modules)
│   │   └── src/
│   │       ├── http.ts
│   │       ├── index.ts
│   │       ├── resources/
│   │       │   ├── animals.ts
│   │       │   ├── breeding.ts
│   │       │   ├── contacts.ts
│   │       │   └── offspring.ts
│   │       └── types/
│   │           ├── animals.ts
│   │           ├── breeding.ts
│   │           ├── contacts.ts
│   │           └── offspring.ts
│   │
│   ├── config/                     # Shared config (Tailwind preset, ESLint, Prettier)
│   │   ├── tailwind-preset.ts
│   │   ├── eslint/base.cjs
│   │   └── prettier/base.json
│   │
│   ├── tw-preset/                  # Tailwind preset (alternative)
│   │   └── index.js
│   │
│   └── ui/                         # Shared UI library (THE BIG ONE)
│       └── src/
│           ├── index.ts            # Main export
│           ├── bhq.css             # Global styles
│           ├── atoms/              # Basic building blocks
│           │   ├── Spinner.tsx
│           │   └── Toast.tsx
│           ├── components/         # Reusable components
│           │   ├── Address/
│           │   ├── AppSection/
│           │   ├── Badge/
│           │   ├── BreedSelect/
│           │   ├── Button/
│           │   ├── Calendar/
│           │   ├── Card/
│           │   ├── ChecklistFilter/
│           │   ├── ColumnsPopover/
│           │   ├── CountrySelect/
│           │   ├── Dialog/
│           │   ├── Drawer/         # DetailsDrawer, DetailsHost, etc.
│           │   ├── EmptyState/
│           │   ├── EntityRow/
│           │   ├── FieldRow/
│           │   ├── Filters/        # FilterChips, FiltersPanel, FiltersRow
│           │   ├── Gantt/
│           │   ├── Input/
│           │   ├── IntlPhoneField/
│           │   ├── MedicationDoser/
│           │   ├── MiniStat/
│           │   ├── OverlayShell/
│           │   ├── Ownership/
│           │   ├── PageHeader/
│           │   ├── PillToggle/
│           │   ├── Popover/
│           │   ├── RegionSelect/
│           │   ├── SearchBar/
│           │   ├── SectionCard/
│           │   ├── SettingsProtocols/
│           │   ├── StatCard/
│           │   ├── TabButton/
│           │   ├── Table/          # Table, TableCell, TableHeader, TablePagination, etc.
│           │   ├── Tabs/
│           │   ├── TagsPopover/
│           │   └── ThemeToggle/
│           ├── hooks/              # Shared hooks
│           │   ├── useAsyncList.ts
│           │   ├── useAvailabilityPrefs.ts
│           │   ├── useBreedProgram.ts
│           │   ├── useBreedSearch.ts
│           │   ├── useColumns.ts
│           │   ├── useCountries.ts
│           │   ├── useDebounced.ts
│           │   ├── useDirtyConfirm.ts
│           │   ├── useDisclosure.ts
│           │   ├── useFilterState.ts
│           │   ├── useIndeterminate.ts
│           │   ├── useOverlayHost.ts
│           │   ├── useOverlayInteractivity.ts
│           │   ├── usePagination.ts
│           │   ├── usePopoverPosition.ts
│           │   ├── useQueryState.ts
│           │   ├── useSelection.ts
│           │   ├── useServerSort.ts
│           │   ├── useSort.ts
│           │   └── useTableController.ts
│           ├── layouts/
│           │   ├── AppShell.tsx
│           │   └── NavShell.tsx
│           ├── overlay/            # Overlay system
│           │   ├── core.ts
│           │   ├── flyout.ts
│           │   ├── Overlay.tsx
│           │   ├── OverlayMount.tsx
│           │   ├── PortalHosts.tsx
│           │   └── Portals.tsx
│           ├── settings/
│           │   └── UiScaleProvider.tsx
│           ├── storage/
│           │   └── namespacedPrefs.ts
│           ├── styles/
│           │   ├── base.css
│           │   ├── calendar.css
│           │   ├── datefield.css
│           │   ├── details.css
│           │   ├── gantt.css
│           │   ├── global.css
│           │   ├── table.css
│           │   ├── table-footer.css
│           │   └── theme.css
│           └── utils/              # Shared utilities
│               ├── availability.ts
│               ├── breederSettings.ts
│               ├── breedingProgram.ts
│               ├── breedsApi.ts
│               ├── cn.ts           # className utility
│               ├── hosts.ts
│               ├── medicationReminders.ts
│               ├── medications.ts
│               ├── ownership.ts
│               ├── repro.ts
│               ├── sort.ts
│               ├── species.ts
│               ├── tenant.ts
│               ├── types.ts
│               ├── weights.ts
│               └── reproEngine/    # NEW reproduction engine (replacing breedingMath)
│                   ├── defaults.ts
│                   ├── effectiveCycleLen.ts
│                   ├── index.ts
│                   ├── normalize.ts
│                   ├── projectUpcomingCycles.ts
│                   ├── timelineFromSeed.ts
│                   └── types.ts
│
├── docs/
│   ├── confluence_structure.md
│   ├── workflow-npn.md
│   ├── adr/                        # Architecture Decision Records
│   │   ├── 0000-overlay_root_temp.md
│   │   ├── 0001-shared-api-sdk.md
│   │   ├── 0002-layout_ownership.md
│   │   ├── 0003-overlay_scope.md
│   │   └── 0004-module-shell_contract.md
│   └── legacy/
│
├── scripts/
│   └── codemods/
│
└── [Root Config]
    ├── package.json
    ├── tsconfig.base.json
    ├── eslint.config.mjs
    └── breederhq.code-workspace
```

### Key Files by Function

| Purpose | Location |
|---------|----------|
| Animals main page | `apps/animals/src/App-Animals.tsx` |
| Breeding entry/tabs | `apps/breeding/src/App-Breeding.tsx` |
| Breeding Calendar | `apps/breeding/src/components/BreedingCalendar.tsx` |
| Breeding Gantt charts | `apps/breeding/src/components/PerPlanGantt.tsx`, `RollupGantt.tsx` |
| Plan → Event adapters | `apps/breeding/src/adapters/` |
| Contacts main page | `apps/contacts/src/App-Contacts.tsx` |
| Shared UI components | `packages/ui/src/components/` |
| Shared hooks | `packages/ui/src/hooks/` |
| reproEngine (new) | `packages/ui/src/utils/reproEngine/` |
| API types | `packages/api/src/types/` |
| API resources | `packages/api/src/resources/` |

### Notes
- Each app has `.old` and `.bak` files from iterative development - these are backups
- The `reproEngine` in `packages/ui/src/utils/` is the new breeding math system replacing legacy `breedingMath`
- ADRs in `docs/adr/` document key architecture decisions
