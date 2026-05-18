#!/usr/bin/env bash
# monorepo-publish.sh
#
# Publishes every non-private package in this monorepo to NPM.
# Any arguments are forwarded directly to `npm publish`, so you can use:
#
#   ./monorepo-publish.sh                   # normal publish
#   ./monorepo-publish.sh --dry-run         # dry run (nothing actually published)
#   ./monorepo-publish.sh --tag next        # publish under the "next" dist-tag

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGES_DIR="$SCRIPT_DIR/packages"

# Collect any extra flags to pass through to npm publish
EXTRA_ARGS=("$@")

echo "Publishing packages from ${PACKAGES_DIR}..."
echo ""

for pkg_dir in "$PACKAGES_DIR"/*/; do
  [ -f "$pkg_dir/package.json" ] || continue

  pkg_name="$(basename "$pkg_dir")"

  # Skip packages marked private
  is_private="$(node -e "
    const pkg = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
    process.stdout.write(pkg.private ? 'true' : 'false');
  " "$pkg_dir/package.json")"

  if [ "$is_private" = "true" ]; then
    echo "  skipping ${pkg_name} (private)"
    continue
  fi

  pkg_version="$(node -e "
    const pkg = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
    process.stdout.write(pkg.version || '(no version)');
  " "$pkg_dir/package.json")"

  echo "  publishing ${pkg_name}@${pkg_version}..."
  (cd "$pkg_dir" && npm publish "${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}")
done

echo ""
echo "Done. All packages published."
