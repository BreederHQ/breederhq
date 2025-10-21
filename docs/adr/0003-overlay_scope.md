# ADR 0003: Overlay Scope

Local by default: Popovers, drawers, modals that belong to a module render in the same document as their trigger (no shared root).

Global exceptions: Only these use the shell’s overlay root: (a) Org Switcher, (b) Global Settings, (c) Global Search/Command Palette, (d) Global Notifications.