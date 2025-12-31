#!/bin/bash
# Vercel build wrapper with Dependabot skip logic
#
# Usage: bash scripts/vercel-build.sh apps/portal
#        bash scripts/vercel-build.sh apps/marketplace
#
# For Dependabot branches: creates empty dist/ and exits successfully
# For all other branches: runs the actual build

set -e

APP_PATH="$1"

if [[ -z "$APP_PATH" ]]; then
  echo "Error: APP_PATH argument required"
  exit 1
fi

# Skip build for Dependabot branches
if [[ "$VERCEL_GIT_COMMIT_REF" == dependabot/* ]]; then
  echo "Skipping build: Dependabot branch ($VERCEL_GIT_COMMIT_REF)"
  # Create empty output directory so Vercel doesn't fail
  mkdir -p "$APP_PATH/dist"
  echo "<html><body>Build skipped for Dependabot</body></html>" > "$APP_PATH/dist/index.html"
  exit 0
fi

# Proceed with actual build
echo "Building: $VERCEL_GIT_COMMIT_REF"
cd ../..
npm run -w "$APP_PATH" build
