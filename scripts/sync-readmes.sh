#!/usr/bin/env bash
# Sync each project's repo README into src/content/readmes/<projectId>.md, so the
# project detail page can show it collapsed. Only projects that HAVE a DeepWiki
# detail doc (src/content/projects/es/<projectId>.md) are synced. Repos with an
# empty/missing README are skipped (no entry -> no disclosure on the page).
#
# Requires: gh (authenticated). Run from the repo root: bash scripts/sync-readmes.sh
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p src/content/readmes

# Map projectId -> owner repo, parsed from data/projects.ts (id precedes repoUrl
# within each seed block).
map=$(awk "
/id: '/ { match(\$0, /id: '([^']+)'/, a); id=a[1] }
/repoUrl: '/ { match(\$0, /github.com\/([^'\/]+)\/([^'\/]+)/, b); print id, b[1], b[2] }
" src/data/projects.ts)

saved=0; skipped=0
for f in src/content/projects/es/*.md; do
  pid=$(basename "$f" .md)
  line=$(echo "$map" | grep -m1 "^$pid " || true)
  [ -z "$line" ] && { echo "skip (no repo)   $pid"; skipped=$((skipped+1)); continue; }
  owner=$(echo "$line" | awk '{print $2}'); repo=$(echo "$line" | awk '{print $3}')
  b64=$(gh api "repos/$owner/$repo/readme" --jq '.content' 2>/dev/null | tr -d '\n' || true)
  if [ -n "$b64" ]; then
    tmp=$(mktemp); echo "$b64" | base64 -d > "$tmp" 2>/dev/null || true
    if [ "$(wc -w < "$tmp")" -ge 5 ]; then
      mv "$tmp" "src/content/readmes/$pid.md"; echo "ok               $pid ($owner/$repo)"; saved=$((saved+1))
    else
      rm -f "$tmp" "src/content/readmes/$pid.md" 2>/dev/null || true; echo "skip (empty)     $pid"; skipped=$((skipped+1))
    fi
  else
    echo "skip (no readme) $pid ($owner/$repo)"; skipped=$((skipped+1))
  fi
done
echo "---"
echo "$saved READMEs synced, $skipped skipped"
