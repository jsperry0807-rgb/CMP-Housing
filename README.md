# ECTS Housing — Turborepo + Vite/React + Express starter

A monorepo template with a React frontend and an authenticated Express + MongoDB API.

## What's inside?

### Apps and Packages

- `web`: a [React 19](https://react.dev) + [Vite](https://vite.dev) + [Tailwind CSS 4](https://tailwindcss.com) app with [shadcn/ui](https://ui.shadcn.com) components — a landing page (`#/`), login (`#/login`), signup (`#/signup`), and a private dashboard (`#/dashboard`)
- `api`: an [Express 5](https://expressjs.com) API with [Mongoose](https://mongoosejs.com) (MongoDB), JWT auth in httpOnly cookies, and bcrypt password hashing
- `@repo/ui`: a stub component and utility library
- `@repo/eslint-config`: shared ESLint configuration
- `@repo/typescript-config`: shared `tsconfig.json` files

Each package and app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

## Getting started

```sh
pnpm install
cp apps/api/.env.example apps/api/.env   # set MONGODB_URI and JWT_SECRET
pnpm dev
```

- web → http://localhost:5173
- api → http://localhost:4000

`pnpm dev` runs both apps. API requests from the web app go to `/api/*`,
which Vite proxies to `apps/api` in development.

## Auth API

| Method | Route              | Description                                |
| ------ | ------------------ | ------------------------------------------ |
| `POST` | `/api/auth/signup` | Create an account, sets the session cookie |
| `POST` | `/api/auth/login`  | Log in with email + password               |
| `POST` | `/api/auth/logout` | Clear the session cookie                   |
| `GET`  | `/api/auth/me`     | Current user (requires the session cookie) |
| `GET`  | `/api/health`      | Service + database status                  |

```sh
curl -c cookies.txt -X POST http://localhost:4000/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"password123"}'

curl -b cookies.txt http://localhost:4000/api/auth/me
```

Sessions are a signed JWT in an `httpOnly` cookie; `sameSite=lax`, and `secure`
in production. Passwords are hashed with bcrypt in a Mongoose `pre("save")`
hook and the `password` field is `select: false`, so it never leaves the API.

## Listings API

Public reads only ever return `active` listings. `pending`, `rejected`, `draft`,
and `rented` listings are visible to their owner and to admins.

| Method   | Route                             | Who       | Description                                     |
| -------- | --------------------------------- | --------- | ----------------------------------------------- |
| `GET`    | `/api/listings`                   | public    | Browse, with filters + pagination (see below)   |
| `GET`    | `/api/listings/featured`          | public    | The three newest active listings                |
| `GET`    | `/api/listings/:slug`             | public    | One listing by slug                             |
| `POST`   | `/api/listings`                   | signed in | Create a listing (lands in `pending`)           |
| `PATCH`  | `/api/listings/:id`               | owner     | Update your listing                             |
| `DELETE` | `/api/listings/:id`               | owner     | Delete your listing                             |
| `GET`    | `/api/me/listings`                | signed in | Your listings, any status, with counts          |
| `GET`    | `/api/admin/listings`             | admin     | Moderation queue (`?status=pending` by default) |
| `POST`   | `/api/admin/listings/:id/approve` | admin     | Publish a listing                               |
| `POST`   | `/api/admin/listings/:id/reject`  | admin     | Reject it, with `{ "reason": "…" }`             |

Browse query parameters: `q`, `city`, `type`, `minPrice`, `maxPrice`, `bedrooms`,
`furnished`, `sort` (`newest` \| `price-asc` \| `price-desc`), `page`, `limit`.
The response is `{ items, total, page, pageSize, pages }`.

`pricePerMonth` is a whole number of currency units (e.g. `750` = €750), and
`currency` defaults to `EUR`.

## Demo data

```sh
pnpm --filter api db:seed              # 21 listings + 4 demo accounts
pnpm --filter api promote you@example.com   # grant the admin role
```

The seed script only replaces listings owned by the demo accounts, so anything
you create yourself is left alone. All demo accounts use the password
`password123`:

| Email                 | Role  |
| --------------------- | ----- |
| `mara@example.com`    | user  |
| `jonas@example.com`   | user  |
| `admin@example.com`   | admin |
| `student@example.com` | user  |

Listing images come from [picsum.photos](https://picsum.photos), so a network
connection is needed for them to load.

## Pages

The web app is a single page app driven by the URL hash, so every view is
linkable and the browser's back button works. Browse filters live in the query
string, which makes a filtered list easy to share.

| Hash                              | Page                                                |
| --------------------------------- | --------------------------------------------------- |
| `#/`                              | Home: hero, search and featured listings            |
| `#/listings`                      | Browse; see the query parameters below              |
| `#/listings/:slug`                | Listing detail: gallery, specs, amenities, address  |
| `#/login`, `#/signup`             | Auth                                                |
| `#/dashboard`                     | Signed-in overview: your counts and recent listings |
| `#/dashboard/listings`            | Your listings, in every status                      |
| `#/dashboard/listings/new`        | Create a listing                                    |
| `#/dashboard/listings/:slug/edit` | Edit one of your listings                           |
| `#/dashboard/moderation`          | Admin-only moderation queue (approve / reject)      |

Browse reads `q`, `type`, `maxPrice`, `bedrooms`, `furnished`, `sort` and
`page` from the query string, so `#/listings?q=Berlin&maxPrice=750` is a valid,
shareable URL.

Everything under `#/dashboard` requires a session, and `#/dashboard/moderation`
additionally requires the `admin` role — `App.tsx` redirects visitors who do not
qualify.

### Posting and moderation

Any signed-in user can post a listing. New listings start as `pending` (or
`draft`, if you save without submitting) and only appear in the public browse
list once an admin approves them:

```
draft ──▶ pending ──▶ active ──▶ rented
             │            ▲
             └─ rejected ─┘   (owner resubmits)
```

Owners can edit their own listings, move them between `draft`, `pending` and
`rented`, and delete them. Only an admin can set `active` or `rejected`.
Editing an approved listing leaves it live, and its slug stays stable unless the
title changes.

Routing lives in `apps/web/src/lib/router.ts` (`parseRoute`, `navigate`,
`useRoute`, `isDashboardRoute`). To add a page, add a branch to `parseRoute` and
a case in `App.tsx`.

## UI components

The web app uses [shadcn/ui](https://ui.shadcn.com) on top of
[Base UI](https://base-ui.com). Components live in `apps/web/src/components/ui`
and are yours to edit. Add more with:

```sh
cd apps/web
pnpm dlx shadcn@latest add table tabs switch
```

`apps/web/components.json` holds the aliases and style (`@/*` → `src/*`,
configured in both `tsconfig.json` and `vite.config.ts`).

## Adding to the API

```
apps/api/src/
  models/<thing>.ts          Mongoose schema + model
  routes/<thing>.routes.ts   Express router
  routes/index.ts            mount it: apiRouter.use("/things", thingsRouter)
```

Errors thrown as `new HttpError(status, message)` are turned into JSON
responses by the shared error handler.
