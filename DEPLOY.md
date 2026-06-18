# Deploying Rex Brutus

The game builds to a static site served by nginx. Two ways to deploy.

## What gets deployed
- `npm run build` → `dist/` (static JS/CSS/HTML)
- `Dockerfile` → multi-stage build: node builds, nginx:alpine serves `dist/` on port 80
- No secrets, no backend, no DB.

## Option A — Coolify (intended)

1. In Coolify, **+ New Resource → Docker Compose / Dockerfile → Public or Private repo**.
2. Repository: `github.com/neima3/dukenukem` (private — use the deploy key in `.deploy/coolify_deploy_key.pub`, or connect your GitHub account once).
3. Build pack: **Dockerfile**, port **80**.
4. Domains: `duke.neima.me` (or your chosen domain). Point DNS A/CNAME at the Coolify server.
5. Deploy. Coolify runs `docker build` and starts the container behind its proxy with TLS.

## Option B — Any static host

```bash
npm run build
# upload dist/ to Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3, etc.
```

## Local dev

```bash
npm install
npm run dev      # vite dev server on :5173
npm run build    # tsc + vite build -> dist/
npm run preview  # serve the built dist/
```

## Secrets
`.env` (gitignored) holds deploy credentials, populated from 1Password via `scripts/fetch-secrets.sh`. Never commit it.
