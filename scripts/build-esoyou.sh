#!/bin/bash
# build-esoyou.sh
#
# Builds a self-contained EsoYou site in dist-esoyou/ for deployment to its
# own Cloudflare Pages project (esoyou.pages.dev).
#
# Strategy: take /astro/ as the site root, copy in the shared dependencies
# (shared/, styles/, branding/, login/) at the same root level, and rewrite
# any "../shared/" or "../styles/" or "../branding/" references in the
# astro files into absolute "/shared/" "/styles/" "/branding/" paths.
#
# Run locally with: bash scripts/build-esoyou.sh
# Cloudflare runs it automatically as the project's "Build command".

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist-esoyou"

echo "→ Building EsoYou into $DIST"

# Clean output dir
rm -rf "$DIST"
mkdir -p "$DIST"

# Copy /astro/ as the site root (so /astro/index.html → /index.html, etc.)
cp -r "$ROOT/astro/." "$DIST/"

# Copy shared dependencies as siblings of root
cp -r "$ROOT/branding"  "$DIST/branding"
cp -r "$ROOT/shared"    "$DIST/shared"
cp -r "$ROOT/styles"    "$DIST/styles"
cp -r "$ROOT/login"     "$DIST/login"

# Rewrite "../shared/", "../styles/", "../branding/" in HTML and JS to "/..."
# (because dependencies are now at root, not in a parent directory)
find "$DIST" -type f \( -name "*.html" -o -name "*.js" \) | while read -r f; do
  sed -i.bak \
    -e 's|\.\./shared/|/shared/|g' \
    -e 's|\.\./styles/|/styles/|g' \
    -e 's|\.\./branding/|/branding/|g' \
    -e 's|/residents/profile\.html|/|g' \
    "$f"
done

# Remove sed backup files
find "$DIST" -name "*.bak" -delete

echo "✓ Built $(find "$DIST" -type f | wc -l | tr -d ' ') files"
echo "  Site root: $DIST"
echo "  Top-level entries:"
ls -1 "$DIST" | sed 's/^/    /'
