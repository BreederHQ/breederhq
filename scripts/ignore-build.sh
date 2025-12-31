#!/bin/bash
# Vercel Ignored Build Step
# https://vercel.com/docs/projects/overview#ignored-build-step
#
# Exit codes:
#   0 = skip build (do not deploy)
#   1 = proceed with build
#
# Usage in vercel.json:
#   "ignoreBuildStep": "bash ../../scripts/ignore-build.sh"

# Skip Dependabot branches
if [[ "$VERCEL_GIT_COMMIT_REF" == dependabot/* ]]; then
  echo "Skipping build: Dependabot branch ($VERCEL_GIT_COMMIT_REF)"
  exit 0
fi

# Proceed with build for all other branches
echo "Proceeding with build: $VERCEL_GIT_COMMIT_REF"
exit 1
