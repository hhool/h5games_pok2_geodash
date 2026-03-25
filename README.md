# H5Games — Static SPA template & per-game page generator

Lightweight static template and build scripts for mobile-first HTML5 game pages. This project provides a responsive single‑page game launcher, per‑game page generator, JSON‑LD SEO metadata, and a sitemap generator — all designed to output a ready-to-deploy `dist/` folder that can be served or deployed to Cloudflare Pages.

## Features

- Mobile-first responsive game gallery and inline iframe player.
- Lazy-loaded thumbnails and minimal runtime JS.
- Automated per-game page generation (`dist/<game-id>/index.html`).
- JSON‑LD snippets and `sitemap.xml` for improved SEO.
- Simple Node build scripts; no heavy frameworks required.

## Project layout (important files)

- `data/games.json` — canonical game metadata used by the site and generators.
- `scripts/generate-pages.js` — emits per-game pages into `dist/`.
- `scripts/gen-sitemap.js` — builds `dist/sitemap.xml`.
- `game-template.html` / `src/` — the SPA template and client logic (editable).
- `dist/` — output directory produced by `npm run build` (ready to serve).

## Quick start

1. Install dependencies:

```
npm ci
```

2. Build the static site:

```
npm run build
```

3. Preview locally (simple static server):

```
python3 -m http.server --directory dist 8080
```

Open `http://localhost:8080` in your browser to verify the gallery and per-game pages.

## Development notes

- To add or update a game, edit `data/games.json` and then run `npm run build` to regenerate `dist/`.
- The client SPA uses `history.pushState` to expose pretty URLs like `/g1/`; ensure your static host serves `dist/` directly (the per-game pages are generated under `dist/<id>/index.html`).
- If you modify templates or generator scripts, rebuild to propagate changes.

## Deployment

Deploy the `dist/` directory to any static host. For Cloudflare Pages, set the build command to:

```
npm run build
```

and the publish directory to:

```
dist
```

Ensure any required environment variables or secrets are configured in your Cloudflare Pages project if you add external integrations.

## Troubleshooting

- If the preview server fails to bind ports, try a different port (e.g. `8081`) or kill the process occupying the port.
- Check the browser console for runtime errors related to `data/games.json` or missing assets; re-run `npm run build` if assets are out of sync.

## License & contact

This repository contains project templates and scripts. Update this section with your chosen license and contact information as needed.

---

Regenerated on 2026-03-24.

## Project status (short)

- Completed: inject `ENV_SITE_ROOT` into generated pages (build-time), prefer absolute asset/OG/canonical URLs when `ENV_SITE_ROOT` is set, origin-aware `buildTargetForId()` to avoid cross-origin pushState errors, and improved `fetch` candidate heuristics for `data/games.json`.
- Pending: run final build with `ENV_SITE_ROOT` baked in and publish `dist/` to your Pages hosting; purge CDN cache if you use Cloudflare.

## Build & deploy (recommended commands)

Bake `ENV_SITE_ROOT` into generated pages (recommended for GitHub Pages):

```bash
ENV_SITE_ROOT="https://geometrydash.poki2.online/" npm run build
node scripts/generate-pages.js --site-root "$ENV_SITE_ROOT"
```

Publish `dist/` (examples):

- Wrangler Pages:

```bash
npx wrangler pages publish ./dist --project-name=h5games-poki2-geodash --branch=main --commit-message="publish $(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

- Or let the GitHub Actions workflow dispatch (workflow: `.github/workflows/ci-deploy.yml`) run on push/main or manual dispatch; it will set `ENV_SITE_ROOT` from the workflow input or default.

Purge Cloudflare cache (if applicable):

```bash
./tools/deploy/purge-cloudflare.sh --all --zone <ZONE_ID> --token <TOKEN>
```

Replace `<ZONE_ID>` and `<TOKEN>` with your Cloudflare values.
