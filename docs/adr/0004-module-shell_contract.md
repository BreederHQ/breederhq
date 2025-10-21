# ADR 0004: Module <-> Shell Contract

Modules announce active view: window.dispatchEvent(new CustomEvent('bhq:module', { detail: { label } })).

Global UI is requested via events: bhq:openSettings, bhq:openOrgSwitcher, bhq:globalSearch, bhq:openNotifications.

Modules never reach into shell internals.