# Confluence Page Tree Structure

This document defines the full Confluence page tree for BreederHQ.  
All new documentation must align to this structure.

---

## 📦 Modules / Capabilities / Components   (parent grouping page)

### 📦 Modules
- 📇 Contacts
- 🐾 Animals
- 🧬 Breeding (Cycles)
- 📣 Marketing
- 💵 Finance

### 🛠️ Capabilities
- 🏢 Organizations
- 💳 Deposits
- 🏷️ Tags
- 📑 Custom Fields
- 📂 Documents
- 🌐 Social Media Integrations (Facebook, TikTok, Instagram)
- ✍️ eSign Integrations
- 🔗 QuickBooks Integration

### ⚙️ Components
- 💳 Payments Service
- 📜 Audit Log Service
- 🛡️ Grants & Permissions
- *(Future)* Notifications, Search/Indexing, File Storage

---

## 🗄️ Architecture & Data
- 🔑 Access & Security Model
- 🔗 API Contracts
- 🗄️ Data Models & ERDs
- 🗃️ Migrations & Versions
- 📦 Repository & Naming Conventions
- 🧩 Implementation
  - 🖥️ Backend
  - 💻 Frontend
  - 🔄 CI/CD
  - 🧪 Testing
- ⚙️ Engineering Operations
  - 📘 Runbooks
    - 🗃️ Prisma Migrations: Dev → Stage → Prod
    - 🚀 Deploy: Vercel (Web)
    - 🔧 Deploy: Render (API)
    - 🔐 Secret Rotation
    - 🛑 Incident Response
  - 🌍 Environment Management
  - ✅ Operational Checks

---

## 🏢 Business & Operations
- 💲 Pricing & SKUs
- 📜 Contracts & Legal
- 🤝 Partners & Vendors
- 🧾 Equity & Ownership
- 🗂️ Internal Operations (HR, Finance, etc.)

---

## 🗓️ Backlog & Roadmap
- 📝 Feature Pipeline
- 🎯 Priorities
- ⏱️ Timelines
- 📰 Release Notes
- 🛣️ Strategic Roadmap

---

## Documentation Rules
- **Modules** = core workspaces with their own UI and data models.  
  - Document under **Modules**.  
  - Also appear under **Business & Operations → Pricing & SKUs** as high-level feature bundles.  
- **Capabilities** = cross-cutting features that extend Modules.  
- **Components** = backend services that power Modules/Capabilities.  
- **Implementation decisions** (repos, DB, CI/CD, environments) → document under **Architecture & Data → Implementation**.  
- **Operational runbooks** (migrations, deployments, rotations) → document under **Architecture & Data → Engineering Operations**.  
- **Business process or company ops** → document under **Business & Operations**.  
- **Future features, timing, prioritization** → document under **Backlog & Roadmap**.
