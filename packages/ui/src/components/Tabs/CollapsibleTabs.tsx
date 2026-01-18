// packages/ui/src/components/Tabs/CollapsibleTabs.tsx
// Tab bar with pinned tabs visible and overflow tabs in a "More" menu.
// Tabs with alerts auto-surface even if unpinned.

import * as React from "react";
import { Popover } from "../Popover";
import {
  MoreHorizontal,
  Settings,
  Pin,
  PinOff,
  GripVertical,
  Check,
  LayoutGrid,
  Activity,
  Target,
  Store,
  Heart,
  Dna,
  FileText,
  DollarSign,
  FolderOpen,
  Image,
  GitBranch,
  Baby,
  Award,
  Trophy,
  Calendar,
  Shield,
  History,
} from "lucide-react";

export type CollapsibleTab = {
  key: string;
  label: React.ReactNode;
  badge?: React.ReactNode;
  /** If true, this tab has an alert and should auto-surface */
  hasAlert?: boolean;
};

export type TabPreferences = {
  /** Tab keys in order of display. First N are pinned/visible. */
  pinnedTabs: string[];
};

export type CollapsibleTabsProps = {
  tabs: CollapsibleTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  /** User's saved preferences for which tabs are pinned */
  preferences?: TabPreferences;
  /** Callback when user changes preferences (pin/unpin/reorder) */
  onPreferencesChange?: (prefs: TabPreferences) => void;
  /** Default pinned tabs if no preferences saved */
  defaultPinnedTabs?: string[];
  /** Whether to show the customize option in the menu */
  showCustomize?: boolean;
  /** Callback when customize is clicked */
  onCustomize?: () => void;
};

const DEFAULT_PINNED_COUNT = 5;

export function CollapsibleTabs({
  tabs,
  activeTab,
  onTabChange,
  preferences,
  onPreferencesChange,
  defaultPinnedTabs,
  showCustomize = true,
  onCustomize,
}: CollapsibleTabsProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Determine which tabs are pinned
  const pinnedKeys = React.useMemo(() => {
    if (preferences?.pinnedTabs?.length) {
      return preferences.pinnedTabs;
    }
    if (defaultPinnedTabs?.length) {
      return defaultPinnedTabs;
    }
    // Default: first N tabs
    return tabs.slice(0, DEFAULT_PINNED_COUNT).map(t => t.key);
  }, [preferences, defaultPinnedTabs, tabs]);

  // Split tabs into pinned, alert (auto-surfaced), and overflow
  // Note: We do NOT auto-surface the active tab if it's in overflow.
  // The dropdown menu shows which tab is active, and auto-surfacing causes
  // layout shifts (especially when the active tab is the last overflow tab,
  // which would make the More button disappear).
  const { visibleTabs, overflowTabs } = React.useMemo(() => {
    const pinned: CollapsibleTab[] = [];
    const alertTabs: CollapsibleTab[] = [];
    const overflow: CollapsibleTab[] = [];

    for (const tab of tabs) {
      const isPinned = pinnedKeys.includes(tab.key);
      if (isPinned) {
        pinned.push(tab);
      } else if (tab.hasAlert || tab.badge) {
        // Auto-surface tabs with alerts (but not just because active)
        alertTabs.push(tab);
      } else {
        overflow.push(tab);
      }
    }

    // Sort pinned tabs by their order in pinnedKeys
    pinned.sort((a, b) => pinnedKeys.indexOf(a.key) - pinnedKeys.indexOf(b.key));

    return {
      visibleTabs: [...pinned, ...alertTabs],
      overflowTabs: overflow,
    };
  }, [tabs, pinnedKeys]);

  // Check if any overflow tab has an alert (for badge on More button)
  const overflowHasAlert = overflowTabs.some(t => t.hasAlert || t.badge);

  const handleTabClick = (key: string) => {
    onTabChange(key);
    setMenuOpen(false);
  };

  const handlePin = (key: string) => {
    if (!onPreferencesChange) return;
    const newPinned = [...pinnedKeys, key];
    onPreferencesChange({ pinnedTabs: newPinned });
  };

  const handleUnpin = (key: string) => {
    if (!onPreferencesChange) return;
    const newPinned = pinnedKeys.filter(k => k !== key);
    onPreferencesChange({ pinnedTabs: newPinned });
  };

  return (
    <div className="flex items-center justify-between w-full">
      {/* Visible tabs - left side */}
      <div className="flex items-center gap-1 flex-wrap">
        {visibleTabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const isPinned = pinnedKeys.includes(tab.key);
          // Auto-surfaced tabs are those with alerts/badges that aren't pinned
          const isAutoSurfaced = !isPinned && (tab.hasAlert || !!tab.badge);

          return (
            <TabButton
              key={tab.key}
              tab={tab}
              isActive={isActive}
              isPinned={isPinned}
              isAutoSurfaced={isAutoSurfaced}
              onClick={() => handleTabClick(tab.key)}
              onPin={onPreferencesChange ? () => handlePin(tab.key) : undefined}
              onUnpin={onPreferencesChange ? () => handleUnpin(tab.key) : undefined}
            />
          );
        })}
      </div>

      {/* Overflow menu - right side, always visible */}
      {overflowTabs.length > 0 && (
        <TabsDrawer
          open={menuOpen}
          onOpenChange={setMenuOpen}
          overflowTabs={overflowTabs}
          pinnedTabs={visibleTabs.filter(t => pinnedKeys.includes(t.key))}
          activeTab={activeTab}
          onTabClick={handleTabClick}
          onPin={onPreferencesChange ? handlePin : undefined}
          onUnpin={onPreferencesChange ? handleUnpin : undefined}
          showCustomize={showCustomize}
          onCustomize={onCustomize}
          overflowHasAlert={overflowHasAlert}
        />
      )}
    </div>
  );
}

// ====================== TABS DRAWER (Account Menu Style) ======================

function TabsDrawer({
  open,
  onOpenChange,
  overflowTabs,
  pinnedTabs,
  activeTab,
  onTabClick,
  onPin,
  onUnpin,
  showCustomize,
  onCustomize,
  overflowHasAlert,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overflowTabs: CollapsibleTab[];
  pinnedTabs: CollapsibleTab[];
  activeTab: string;
  onTabClick: (key: string) => void;
  onPin?: (key: string) => void;
  onUnpin?: (key: string) => void;
  showCustomize?: boolean;
  onCustomize?: () => void;
  overflowHasAlert: boolean;
}) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, onOpenChange]);

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, onOpenChange]);

  const handleTabSelect = (key: string) => {
    // Close menu first, then change tab to avoid race conditions
    onOpenChange(false);
    // Use setTimeout to ensure the menu close completes before tab change
    // This prevents visual glitches from simultaneous state updates
    requestAnimationFrame(() => {
      onTabClick(key);
    });
  };

  // Check if the currently active tab is in the overflow menu
  const activeInOverflow = overflowTabs.some(t => t.key === activeTab);
  // Find the active overflow tab to show its name in the button
  const activeOverflowTab = overflowTabs.find(t => t.key === activeTab);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button - Shows active tab name when active tab is in overflow */}
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={`
          relative inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors
          ${open || activeInOverflow
            ? "border-[hsl(var(--brand-orange))] bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]"
            : "border-hairline bg-transparent text-secondary hover:bg-white/5 hover:text-primary"
          }
        `}
        aria-label="More tabs"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {activeInOverflow ? (
          <>
            <TabIcon tabKey={activeTab} className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">{activeOverflowTab?.label}</span>
          </>
        ) : (
          <>
            <MoreHorizontal className="h-4 w-4" />
            <span className="text-xs font-medium">More</span>
          </>
        )}
        <span className={`
          inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-medium rounded-full
          ${overflowHasAlert
            ? "bg-[hsl(var(--brand-orange))] text-white"
            : activeInOverflow
              ? "bg-[hsl(var(--brand-orange))]/20 text-[hsl(var(--brand-orange))]"
              : "bg-surface-strong text-secondary"
          }
        `}>
          {overflowTabs.length}
        </span>
      </button>

      {/* Dropdown Menu - Account Menu Style */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-hairline bg-surface shadow-xl z-[9999] overflow-hidden"
          role="menu"
        >
          {/* Pinned Tabs Section */}
          {pinnedTabs.length > 0 && (
            <div className="p-2 border-b border-hairline">
              <div className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                <Pin className="h-3 w-3" />
                Pinned
              </div>
              {pinnedTabs.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                  <div
                    key={tab.key}
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => handleTabSelect(tab.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleTabSelect(tab.key);
                      }
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface-strong transition cursor-pointer group ${
                      isActive ? "bg-surface-strong" : ""
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isActive
                        ? "bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]"
                        : "bg-surface-strong text-muted-foreground"
                    }`}>
                      <TabIcon tabKey={tab.key} className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate flex items-center gap-1.5">
                        {tab.label}
                        {tab.badge}
                      </div>
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 text-[hsl(var(--brand-orange))] shrink-0" />
                    )}
                    {onUnpin && !isActive && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnpin(tab.key);
                        }}
                        className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Unpin"
                      >
                        <PinOff className="h-3 w-3 text-tertiary" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Other Tabs Section */}
          {overflowTabs.length > 0 && (
            <div className="p-2 border-b border-hairline max-h-[280px] overflow-y-auto">
              <div className="text-xs text-muted-foreground px-2 py-1">More sections</div>
              {overflowTabs.map((tab) => {
                const isActive = tab.key === activeTab;
                const hasAlert = tab.hasAlert || !!tab.badge;
                return (
                  <div
                    key={tab.key}
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => handleTabSelect(tab.key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleTabSelect(tab.key);
                      }
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface-strong transition cursor-pointer group ${
                      isActive ? "bg-surface-strong" : ""
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      hasAlert
                        ? "bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]"
                        : isActive
                          ? "bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))]"
                          : "bg-surface-strong text-muted-foreground"
                    }`}>
                      <TabIcon tabKey={tab.key} className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate flex items-center gap-1.5">
                        {tab.label}
                        {tab.badge}
                      </div>
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 text-[hsl(var(--brand-orange))] shrink-0" />
                    )}
                    {onPin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPin(tab.key);
                        }}
                        className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Pin to tab bar"
                      >
                        <Pin className="h-3 w-3 text-tertiary" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions Section */}
          {showCustomize && onCustomize && (
            <div className="p-2">
              <button
                onClick={() => {
                  onOpenChange(false);
                  onCustomize();
                }}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-strong transition text-left"
                role="menuitem"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Customize tabs...</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ====================== TAB ICONS ======================

// Map tab keys to appropriate icons
function TabIcon({ tabKey, className }: { tabKey: string; className?: string }) {
  // Import icons from lucide-react at the top of the file
  const icons: Record<string, React.ReactNode> = {
    overview: <LayoutGrid className={className} />,
    cycle: <Activity className={className} />,
    program: <Target className={className} />,
    marketplace: <Store className={className} />,
    health: <Heart className={className} />,
    genetics: <Dna className={className} />,
    registry: <FileText className={className} />,
    finances: <DollarSign className={className} />,
    documents: <FolderOpen className={className} />,
    media: <Image className={className} />,
    lineage: <GitBranch className={className} />,
    offspring: <Baby className={className} />,
    titles: <Award className={className} />,
    competitions: <Trophy className={className} />,
    "mare-history": <Calendar className={className} />,
    privacy: <Shield className={className} />,
    audit: <History className={className} />,
  };

  return icons[tabKey] || <FileText className={className} />;
}

// ====================== INDIVIDUAL TAB BUTTON ======================

// Individual tab button with context menu support
function TabButton({
  tab,
  isActive,
  isPinned,
  isAutoSurfaced,
  onClick,
  onPin,
  onUnpin,
}: {
  tab: CollapsibleTab;
  isActive: boolean;
  isPinned: boolean;
  isAutoSurfaced: boolean;
  onClick: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
}) {
  const [contextMenuOpen, setContextMenuOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onPin && !onUnpin) return;
    e.preventDefault();
    setContextMenuOpen(true);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        role="tab"
        aria-selected={isActive}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        className={`
          relative inline-flex items-center justify-center px-4 py-2 text-sm rounded-md border transition-colors
          select-none outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-orange))]
          ${isActive
            ? "bg-[hsl(var(--surface))] text-primary border-hairline shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            : "bg-transparent text-secondary border-hairline hover:bg-white/5"
          }
          ${isAutoSurfaced ? "border-dashed" : ""}
        `}
      >
        <span className="relative">
          <span className="uppercase tracking-wide flex items-center gap-1.5">
            {tab.label}
            {tab.badge}
          </span>

          {/* Active underline */}
          {isActive && (
            <span
              aria-hidden
              className="absolute left-1 right-1 -bottom-[7px] h-[2px] rounded bg-[hsl(var(--brand-orange))] shadow-[0_0_8px_hsla(var(--brand-orange),0.45)]"
            />
          )}
        </span>
      </button>

      {/* Context menu for pin/unpin */}
      {(onPin || onUnpin) && (
        <Popover open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
          <Popover.Trigger asChild>
            <span style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0 }} />
          </Popover.Trigger>
          <Popover.Content align="start" className="w-40">
            {isPinned && onUnpin && (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-white/5 rounded transition-colors"
                onClick={() => {
                  onUnpin();
                  setContextMenuOpen(false);
                }}
              >
                <PinOff className="h-4 w-4" />
                <span>Unpin tab</span>
              </button>
            )}
            {!isPinned && onPin && (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-primary hover:bg-white/5 rounded transition-colors"
                onClick={() => {
                  onPin();
                  setContextMenuOpen(false);
                }}
              >
                <Pin className="h-4 w-4" />
                <span>Pin tab</span>
              </button>
            )}
          </Popover.Content>
        </Popover>
      )}
    </div>
  );
}

// ====================== CUSTOMIZE MODAL ======================

export type CustomizeTabsModalProps = {
  open: boolean;
  onClose: () => void;
  tabs: CollapsibleTab[];
  preferences: TabPreferences;
  onSave: (prefs: TabPreferences) => void;
  defaultPinnedTabs?: string[];
};

export function CustomizeTabsModal({
  open,
  onClose,
  tabs,
  preferences,
  onSave,
  defaultPinnedTabs,
}: CustomizeTabsModalProps) {
  const [localPinned, setLocalPinned] = React.useState<string[]>([]);

  // Initialize from preferences when modal opens
  React.useEffect(() => {
    if (open) {
      setLocalPinned(preferences?.pinnedTabs?.length ? [...preferences.pinnedTabs] : []);
    }
  }, [open, preferences]);

  const handleTogglePin = (key: string) => {
    setLocalPinned(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleMoveUp = (key: string) => {
    setLocalPinned(prev => {
      const idx = prev.indexOf(key);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const handleMoveDown = (key: string) => {
    setLocalPinned(prev => {
      const idx = prev.indexOf(key);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const handleReset = () => {
    setLocalPinned(defaultPinnedTabs || tabs.slice(0, DEFAULT_PINNED_COUNT).map(t => t.key));
  };

  const handleSave = () => {
    onSave({ pinnedTabs: localPinned });
    onClose();
  };

  if (!open) return null;

  // Build ordered list: pinned first (in order), then unpinned
  const pinnedTabs = localPinned
    .map(key => tabs.find(t => t.key === key))
    .filter((t): t is CollapsibleTab => !!t);
  const unpinnedTabs = tabs.filter(t => !localPinned.includes(t.key));

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-surface border border-hairline rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Customize Visible Tabs</h2>
          <button
            type="button"
            className="text-secondary hover:text-primary p-1"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-sm text-secondary mb-4">
            Pinned tabs appear in the tab bar. Others are accessible via the "More" menu.
          </p>

          {/* Pinned section */}
          <div className="mb-4">
            <div className="text-xs font-medium text-tertiary uppercase tracking-wide mb-2">
              Pinned (visible in tab bar)
            </div>
            <div className="space-y-1">
              {pinnedTabs.length === 0 ? (
                <div className="text-sm text-tertiary py-2 px-3 border border-dashed border-hairline rounded">
                  No pinned tabs. Click the star on tabs below to pin them.
                </div>
              ) : (
                pinnedTabs.map((tab, idx) => (
                  <div
                    key={tab.key}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded border border-hairline"
                  >
                    <GripVertical className="h-4 w-4 text-tertiary cursor-grab" />
                    <span className="flex-1 text-sm text-primary uppercase tracking-wide">
                      {tab.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                        onClick={() => handleMoveUp(tab.key)}
                        disabled={idx === 0}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                        onClick={() => handleMoveDown(tab.key)}
                        disabled={idx === pinnedTabs.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="p-1 hover:bg-white/10 rounded text-[hsl(var(--brand-orange))]"
                        onClick={() => handleTogglePin(tab.key)}
                        title="Unpin"
                      >
                        <Pin className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Unpinned section */}
          <div>
            <div className="text-xs font-medium text-tertiary uppercase tracking-wide mb-2">
              In "More" menu
            </div>
            <div className="space-y-1">
              {unpinnedTabs.length === 0 ? (
                <div className="text-sm text-tertiary py-2 px-3">
                  All tabs are pinned.
                </div>
              ) : (
                unpinnedTabs.map((tab) => (
                  <div
                    key={tab.key}
                    className="flex items-center gap-2 px-3 py-2 rounded border border-transparent hover:border-hairline hover:bg-white/5"
                  >
                    <span className="w-4" /> {/* Spacer for alignment */}
                    <span className="flex-1 text-sm text-secondary uppercase tracking-wide">
                      {tab.label}
                    </span>
                    <button
                      type="button"
                      className="p-1 hover:bg-white/10 rounded text-tertiary hover:text-primary"
                      onClick={() => handleTogglePin(tab.key)}
                      title="Pin to tab bar"
                    >
                      <Pin className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-hairline flex items-center justify-between">
          <button
            type="button"
            className="text-sm text-secondary hover:text-primary"
            onClick={handleReset}
          >
            Reset to defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 text-sm rounded border border-hairline text-secondary hover:text-primary hover:bg-white/5"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm rounded bg-[hsl(var(--brand-orange))] text-white hover:bg-[hsl(var(--brand-orange)/0.9)]"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
