#!/usr/bin/env bash
set -euo pipefail

# Simple local deploy script: build site and push `dist/` to `gh-pages` branch
# Usage: ./scripts/deploy.sh

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

BUILD_DIR=dist
DEPLOY_DIR="/tmp/h5games_deploy_gh_pages"
BRANCH=gh-pages

echo "Building site..."
npm run build --if-present || true
node scripts/generate-pages.js

echo "Preparing deploy directory: $DEPLOY_DIR"
rm -rf "$DEPLOY_DIR"

# Try to create or checkout gh-pages in a worktree. If remote branch doesn't exist,
# create an orphan branch locally and push later.
if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  git worktree add -B "$BRANCH" "$DEPLOY_DIR" "origin/$BRANCH"
else
  git worktree add -B "$BRANCH" "$DEPLOY_DIR"
fi

echo "Copying built files..."
rsync -av --delete --exclude='.git' "$BUILD_DIR/" "$DEPLOY_DIR/"

cd "$DEPLOY_DIR"
git add --all
if git diff --staged --quiet; then
  echo "No changes to deploy. Exiting.";
else
  git commit -m "chore(deploy): update gh-pages [ci skip]"
  git push origin HEAD:$BRANCH
  echo "Deployed to branch $BRANCH"
fi

echo "Cleaning up worktree"
git worktree remove "$DEPLOY_DIR" --force || true
