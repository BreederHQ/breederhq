# ADR 0002: Layout Ownership


NavShell is rendered once by Platform and owns: header, left rail, brand/env badge, org switch, global search, settings/auth.

Modules render content only; they do not import NavShell.