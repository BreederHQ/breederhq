# BreederHQ Entity Relationship Diagrams

This directory contains ERD (Entity Relationship Diagrams) for the BreederHQ database schema, organized by domain.

## Domains

| Domain | Description | File |
|--------|-------------|------|
| **Users & Auth** | User accounts, sessions, passkeys, recovery codes, verification tokens | `01-users-auth.md` |
| **Tenants & Organizations** | Multi-tenancy, organizations, memberships, contacts, parties | `02-tenants-orgs.md` |
| **Animals** | Animals, breeds, registries, ownership, shares, traits | `03-animals.md` |
| **Breeding** | Breeding plans, cycles, attempts, pregnancy checks, test results | `04-breeding.md` |
| **Offspring & Litters** | Offspring groups, individual offspring, litters, waitlist | `05-offspring.md` |
| **Finance** | Invoices, payments, expenses, line items | `06-finance.md` |
| **Marketing & Messaging** | Campaigns, email logs, message threads, templates | `07-marketing.md` |
| **Documents & Contracts** | Documents, contract templates, contracts, signatures | `08-documents.md` |
| **Scheduling** | Event templates, availability blocks, slots, bookings | `09-scheduling.md` |
| **Portal & Access** | Portal access, invites, audit events | `10-portal.md` |

## Formats

Each domain file contains:
- **Mermaid ERD** - Renders in GitHub, VS Code (with Mermaid extension), or [Mermaid Live Editor](https://mermaid.live)
- **DBML** - Can be imported into [dbdiagram.io](https://dbdiagram.io) for visual editing

## Full Schema

For a complete DBML export of all models, see `full-schema.dbml`.

## Quick Stats

- **Total Models**: ~75
- **Total Enums**: ~50+
- **Key Entity Types**: User, Tenant, Organization, Party, Animal, Offspring, Invoice, Contract
