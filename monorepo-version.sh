#!/usr/bin/env bash
# monorepo-version.sh
#
# Bumps every package in this monorepo to a new version, updates all
# cross-package @runtyped/* dependency references, then creates a git
# commit and an annotated tag — no Lerna required.
#
# Usage:
#   ./monorepo-version.sh <version>
#   ./monorepo-version.sh patch        # increments the patch digit
#   ./monorepo-version.sh minor        # increments the minor digit
#   ./monorepo-version.sh major        # increments the major digit
#   ./monorepo-version.sh 1.2.3        # sets an explicit version

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGES_DIR="$SCRIPT_DIR/packages"

# ---------------------------------------------------------------------------
# Usage guard
# ---------------------------------------------------------------------------
if [ $# -lt 1 ]; then
  echo "Usage: $0 <version|patch|minor|major>" >&2
  exit 1
fi

VERSION_ARG="${1}"

# ---------------------------------------------------------------------------
# Resolve the target version
# ---------------------------------------------------------------------------
NEW_VERSION="$(node -e "
  const fs   = require('fs');
  const arg  = process.argv[1];
  const pkgs = fs.readdirSync(process.argv[2]);

  const keywords = ['patch', 'minor', 'major'];

  if (keywords.includes(arg)) {
    // Read the current version from the first package that has one
    let current;
    for (const dir of pkgs) {
      const p = require('path').join(process.argv[2], dir, 'package.json');
      if (fs.existsSync(p)) { current = JSON.parse(fs.readFileSync(p, 'utf8')).version; break; }
    }
    if (!current) { console.error('Could not determine current version'); process.exit(1); }

    const [maj, min, pat] = current.split('.').map(Number);
    switch (arg) {
      case 'major': process.stdout.write((maj + 1) + '.0.0'); break;
      case 'minor': process.stdout.write(maj + '.' + (min + 1) + '.0'); break;
      case 'patch': process.stdout.write(maj + '.' + min + '.' + (pat + 1)); break;
    }
  } else {
    if (!/^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(arg)) {
      console.error('Invalid version: ' + arg);
      process.exit(1);
    }
    process.stdout.write(arg);
  }
" "$VERSION_ARG" "$PACKAGES_DIR")"

echo "Bumping monorepo to v${NEW_VERSION}..."
echo ""

# ---------------------------------------------------------------------------
# 1. Update each package's own version field
# ---------------------------------------------------------------------------
for pkg_dir in "$PACKAGES_DIR"/*/; do
  [ -f "$pkg_dir/package.json" ] || continue
  pkg_name="$(basename "$pkg_dir")"
  echo "  versioning ${pkg_name}..."
  (cd "$pkg_dir" && npm version --no-git-tag-version --allow-same-version "$NEW_VERSION" > /dev/null)
done

echo ""

# ---------------------------------------------------------------------------
# 2. Update every @runtyped/* reference in every package.json
#    (covers dependencies, devDependencies, peerDependencies, optionalDependencies)
# ---------------------------------------------------------------------------
echo "  updating cross-package dependency references..."
node -e "
  const fs   = require('fs');
  const path = require('path');
  const packagesDir = process.argv[1];
  const newVersion  = process.argv[2];
  const DEP_FIELDS  = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

  for (const dir of fs.readdirSync(packagesDir)) {
    const pkgPath = path.join(packagesDir, dir, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;

    const raw = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    let changed = false;

    for (const field of DEP_FIELDS) {
      const deps = pkg[field];
      if (!deps) continue;
      for (const name of Object.keys(deps)) {
        if (name.startsWith('@runtyped/')) {
          const existing = deps[name];
          // Preserve the range prefix (^ or ~) if present
          const prefix = /^[~^]/.test(existing) ? existing[0] : '';
          deps[name] = prefix + newVersion;
          changed = true;
        }
      }
    }

    if (changed) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log('    updated cross-deps in ' + dir + '/package.json');
    }
  }
" "$PACKAGES_DIR" "$NEW_VERSION"

echo ""

# ---------------------------------------------------------------------------
# 3. Commit and tag
# ---------------------------------------------------------------------------
echo "  creating git commit and tag v${NEW_VERSION}..."
git -C "$SCRIPT_DIR" add packages/*/package.json
git -C "$SCRIPT_DIR" commit -m "chore: release v${NEW_VERSION}"
git -C "$SCRIPT_DIR" tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"

echo ""
echo "Done. All packages are now at v${NEW_VERSION}."
echo "Push with:  git push && git push --tags"
