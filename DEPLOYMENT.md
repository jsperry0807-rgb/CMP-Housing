# Deploying ECTS Housing to Railway

ECTS Housing is deployed as **one** Railway service. That service builds the
React app (`apps/web`) and runs the Express API (`apps/api`), and the API serves
the built site. Keeping it on a single origin means the `httpOnly` auth cookie
works without any cross-origin (CORS/`SameSite`) gymnastics — the browser sees
one site, exactly like it does in `pnpm dev`.

Uploaded photos, logos, and 3D models are stored in **MongoDB (GridFS)**, not on
local disk. Railway's filesystem is ephemeral (wiped on redeploy), so the
database is the only place files reliably survive. That also means you don't need
a Railway volume.

```
https://<your-service>.up.railway.app
                 │
                 ├── /            → built React app (from apps/web/dist)
                 ├── /api/*       → Express API
                 └── /uploads/*   → files streamed out of MongoDB GridFS
```

Everything you need is in the repo already:

- [`railway.toml`](./railway.toml) — build, start, health-check and restart settings
- [`apps/api`](./apps/api) — the API, which also serves the built SPA in production
- [`.env.example`](./apps/api/.env.example) — the env vars the API expects

## 1. Prerequisites

- A **Railway** account (Hobby plan or above; Railway no longer has a free tier).
- A **MongoDB Atlas** cluster and its connection string.
- The repo pushed to **GitHub** (Railway deploys from there).

The API reads these environment variables (see `apps/api/src/env.ts`):

| Variable                | Notes                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `MONGODB_URI`           | **Required.** Your Atlas connection string. Name the database (see Troubleshooting). |
| `JWT_SECRET`            | **Required.** Long random value that signs auth cookies.                             |
| `NODE_ENV`              | Set to `production`.                                                                 |
| `PORT`                  | Provided by Railway automatically; don't hardcode it.                                |
| `WEB_ORIGIN`            | The site's public URL — allowed to call the API with credentials.                    |
| `JWT_EXPIRES_IN`        | Optional, defaults to `7d`.                                                          |
| `COOKIE_MAX_AGE_MS`     | Optional, defaults to one week.                                                      |
| `NIXPACKS_NODE_VERSION` | `24`, so the build uses Node 24 (matches `engines.node`).                            |

## 2. Push to GitHub

If you haven't already:

```sh
git remote add origin <your-github-repo-url>
git push -u origin main
```

## 3. Create the Railway service

1. In Railway, **New Project → Deploy from GitHub repo**, and pick this repo.
   Railway reads [`railway.toml`](./railway.toml) for the build/start commands
   and health check.
2. Set the service's **Root Directory** to the repo root (the default). The
   build command runs there.
3. Open the service's **Variables** tab and add:

   - `MONGODB_URI` — your Atlas connection string
   - `NODE_ENV` — `production`
   - `JWT_SECRET` — a long random value (e.g. `openssl rand -base64 32`)
   - `WEB_ORIGIN` — your service URL (set this after step 5)
   - `NIXPACKS_NODE_VERSION` — `24`

   `PORT` is injected by Railway, so don't set it.

The build command is effectively:

```sh
corepack enable && pnpm install --frozen-lockfile && turbo run build --filter=api --filter=web
```

and the start command is `node apps/api/dist/index.js`.

## 4. Allow Atlas connections

In the Atlas dashboard, add Railway under **Network Access → IP Access List**.
The simplest option is **Allow Access from Anywhere** (`0.0.0.0/0`). Atlas
free tiers (M0) support this. Railway's egress IPs are not fixed on the Hobby
plan, so anywhere-access plus a strong DB user password is the usual choice.

## 5. Set `WEB_ORIGIN` after the first deploy

Railway gives the service a URL like `https://<service>.up.railway.app` (or your
custom domain). Once you know it, set `WEB_ORIGIN` to that exact URL (scheme +
host, no trailing slash) in **Variables** and redeploy. It's the origin allowed
to call the API with credentials.

> It's fine if this is momentarily wrong on the very first deploy — you'll fix it
> here before anyone uses the site.

## 6. Create the first admin account

The database starts empty, so there's no way to log in. Railway's service **Shell**
button (or `railway shell`) gives you a terminal in the deployed container. From
the repo root:

```sh
node apps/api/dist/scripts/create-admin.js owner@ects.org
```

(or `… owner@ects.org "chosen-password"` to pick the password). It prints a
freshly generated password. This runs against the production Atlas cluster using
the service's env vars.

Sign in with that email and password, then use the in-app **Manage teams** /
**Users** screens as normal.

## 7. Verify

- `GET /api/health` returns `{ "status": "ok", "database": "connected", … }`.
- The site loads at your service URL, and signing up / logging in sets the
  `ects_housing_token` cookie (it's `secure` in production, so it only travels
  over HTTPS — which Railway provides).
- Uploading a photo to a design stores it in GridFS and it renders back from
  `/uploads/…`.

## How uploads work in production

`POST /api/uploads` (images) and `POST /api/uploads/model` (a `.glb`/`.gltf`
model) stream the file straight into a GridFS bucket named `uploads`. Nothing is
written to disk, so a 100 MB model costs no extra memory and survives redeploys.
`GET /uploads/:name` streams it back; the name is generated and immutable, so the
response is cached aggressively.

Deleting a design, a 3D model, or an account removes the corresponding GridFS
files (best-effort). `pnpm --filter api db:wipe -- --yes` clears them too.

## Feature flags are baked in at build time

The interactive 3D model viewer is behind `VITE_ENABLE_3D_MODELS` (see
`.env.example`). Vite inlines `VITE_*` variables **when the web app is built**,
so setting it in Railway's environment only takes effect on the next build — a
plain restart won't do it. To enable it, add the variable in the service's
**Variables** and redeploy:

```toml
VITE_ENABLE_3D_MODELS=true
```

## Seeding demo data

The seeders refuse to run when `NODE_ENV=production`, so don't seed from Railway.
To populate a **test** Atlas cluster, run them from your machine against that
cluster's connection string:

```sh
MONGODB_URI="<test-cluster-uri>" pnpm --filter api db:seed
```

`db:seed` and `db:seed-history` read photos from `apps/api/seed-images/` when a
folder exists and store them in GridFS; otherwise `db:seed` falls back to
placeholder image URLs.

## Troubleshooting

- **The site starts up with no data, or dev and production share data** — an
  Atlas connection string without a database name (a `/name` before the `?`
  options) makes Mongoose fall back to a database called `test`. Always name it,
  and use a different name per environment:

  ```
  mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/ects_housing?retryWrites=true&w=majority
  mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/ects_housing_dev?retryWrites=true&w=majority
  ```

  Uploads (GridFS) live in that same database, so they follow the same rule.

- **Build fails on `pnpm install`** — make sure `pnpm-lock.yaml` is committed.
  The build uses `--frozen-lockfile`.
- **`Missing required environment variable "MONGODB_URI"`** — set it in the
  service's Variables and redeploy.
- **`MongoDB connection error` / health says `disconnected`** — check the Atlas
  connection string and that Network Access allows connections.
- **Login doesn't stick** — `WEB_ORIGIN` doesn't match the URL you're browsing
  from, or the cookie is being blocked. Set `WEB_ORIGIN` to the exact public URL.
- **`/api/...` returns the HTML page instead of JSON** — that means the built
  site was served for an API path, which shouldn't happen (API routes are
  matched first). Check the service logs.
- **Wrong Node version** — set `NIXPACKS_NODE_VERSION=24` in Variables; Railway's
  default may be older than the `>=24.20.0` the project requires.
  EOF
  echo done
