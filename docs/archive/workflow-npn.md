BreederHQ Root Workflow (npm)

This runbook defines how to work with dependencies, builds, and deployments in the BreederHQ monorepo.

0) One-time setup

Choose Node LTS (20.x recommended; alternatively 22.x).

Create a .node-version file at repo root with the pinned version (example):
20.19.0

Ensure .gitignore contains this line so the lockfile is always tracked:
!package-lock.json

1) First install / update lockfile

Use when:

Cloning the repo for the first time.

Adding/removing/upgrading dependencies in any package.

npm install
git add package-lock.json
git commit -m "chore: update lockfile"

2) Everyday installs

Use for reproducible installs on dev machines, CI, and Vercel.

npm ci

3) Local build & dev

From repo root:

npm ci

build each app once to prove isolation

cd apps/contacts && npm run build && cd ../..
cd apps/animals && npm run build && cd ../..
cd apps/breeding && npm run build && cd ../..

run dev server for one app

cd apps/contacts && npm run dev

4) Changing dependencies

Edit the relevant package.json.

At repo root, refresh the lockfile:

npm install
git add package-lock.json
git commit -m "chore: lockfile update for <what changed>"

Teammates and CI then run:

npm ci

5) Vercel (per app project)

Each app (contacts, animals, breeding) should be its own Vercel project.

Root Directory: apps/<app>

Install Command: npm ci

Build Command: npm run build

Output Directory: dist

Node.js Version: match .node-version (20.x recommended)

Environment Variables:

VITE_API_BASE_URL → your Render API base URL

Optional: VITE_ENV → production / preview / development

6) Troubleshooting

npm ci error: package.json and lockfile not in sync
Run npm install at repo root, commit updated lockfile.

EBADENGINE: Unsupported engine
Align Node version to .node-version or update engines.node in root package.json.

Cannot resolve @bhq/ during build*
Check each app’s vite.config.ts and tsconfig.json for correct alias/paths pointing to ../../packages/*/src.

process is not defined in browser
Use import.meta.env.VITE_* instead of process.env.