# ECTS Housing — Turborepo + Vite/React + Express

A monorepo with a React frontend and an authenticated Express + MongoDB API.
ECTS Housing is the house-design showcase for Erie County Technical School:
student teams design a house, submit it with photos and details, and a teacher
reviews it before it goes live.

## What's inside?

### Apps and Packages

- `web`: a [React 19](https://react.dev) + [Vite](https://vite.dev) + [Tailwind CSS 4](https://tailwindcss.com) app with [shadcn/ui](https://ui.shadcn.com) components — browse as the main page (`#/`), design detail (`#/listings/:slug`), auth (`#/login`, `#/signup`), and a private dashboard (`#/dashboard`) where teams submit designs and staff moderate them, manage teams, and admins manage accounts
- `api`: an [Express 5](https://expressjs.com) API with [Mongoose](https://mongoosejs.com) (MongoDB), JWT auth in httpOnly cookies, bcrypt password hashing, and `multer` file uploads
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

`pnpm dev` runs both apps. API requests from the web app go to `/api/*` and
uploaded photos to `/uploads/*`; Vite proxies both to `apps/api` in development.

## The domain

One **design** (internally still a `Listing`) is a house a team built in class:

- `name`, `slug`, `description`
- `totalCost` (whole USD), `beds`, `baths` (may be fractional, e.g. `3.5`), `sqft`, `year`
- `propertyTax`, `assessment`
- `address` (`line1?`, `city`, `state?`, `postalCode?`)
- `maps` (`location?`, `schools?`, `shops?`) — Google Maps embed URLs
- `highlights[]` and `interior[]` — free-form `{ label, value }` rows
- `roomTypes[]`, `images[]` (up to 15), `similar[]`, `status`, `rejectionReason?`
- `owner` — the student who submitted it, credited as "designed by"
- `team` — the team that owns it; every member can see, edit and delete it

Statuses are `draft → pending → active → rejected`, plus **`not-for-sale`** —
a showcase design that is visible to the public but not on the market. Owners
may set `draft` or `pending`; only staff (a teacher or admin) can set `active`
or `rejected`. `active` and `not-for-sale` are the public statuses.

### Teams

A **Team** is just an identity (`name`, unique; optional `logo`). Membership is
stored on the user (`User.team`), and a teacher assigns students to teams from
the dashboard. Because a design belongs to a team, every member of that team can
manage it — the `owner` field only records who submitted it.

### Roles

Every account has a `role`:

- **student** — submits designs for their team; the default on signup
- **teacher** — reviews (moderates) designs and manages teams
- **admin** — everything a teacher can do, plus managing accounts and roles

Teachers and admins are collectively **staff**. Both moderate designs and manage
teams; only an admin manages accounts. The API mirrors this with `isStaff()` and
`isAdmin()` (`apps/api/src/models/user.ts`), and the web with the same helpers
in `apps/web/src/lib/api.ts`.

## Auth API

| Method  | Route              | Description                         |
| ------- | ------------------ | ----------------------------------- |
| `POST`  | `/api/auth/signup` | Create an account, sets the cookie  |
| `POST`  | `/api/auth/login`  | Log in with email + password        |
| `POST`  | `/api/auth/logout` | Clear the session cookie            |
| `GET`   | `/api/auth/me`     | Current user, with `team` populated |
| `PATCH` | `/api/auth/me`     | Update `name`                       |
| `GET`   | `/api/health`      | Service + database status           |

```sh
curl -c cookies.txt -X POST http://localhost:4000/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@ects.org","password":"password123"}'

curl -b cookies.txt http://localhost:4000/api/auth/me
```

Sessions are a signed JWT in an `httpOnly` cookie; `sameSite=lax`, and `secure`
in production. Passwords are hashed with bcrypt in a Mongoose `pre("save")`
hook and the `password` field is `select: false`, so it never leaves the API.

Signup requires a real email address **on the school domain** (`@ects.org`);
an off-domain address is rejected with a `400`. Logging in is not restricted by
domain, so the seed accounts below (and any existing `@example.com` account)
still work.

Students sign up with just their name, email and password. They can't pick a
team themselves — a teacher assigns them to one, and until then they cannot
submit designs.

## Teams API

Managing teams requires staff (a teacher or admin); `GET /api/me/team` works for
any signed-in user.

| Method   | Route               | Who       | Description                                            |
| -------- | ------------------- | --------- | ------------------------------------------------------ |
| `GET`    | `/api/teams`        | staff     | Every team with members, plus every student account    |
| `POST`   | `/api/teams`        | staff     | Create a team (`{ name, logo? }`)                      |
| `PATCH`  | `/api/teams/:id`    | staff     | Rename a team or change its logo (409 on a name clash) |
| `DELETE` | `/api/teams/:id`    | staff     | Remove a team (409 while it still owns designs)        |
| `POST`   | `/api/teams/assign` | staff     | `{ userId, team }` — assign a student, or `team: null` |
| `GET`    | `/api/me/team`      | signed in | Your team and its members, or `{ "team": null }`       |

Deleting a team unassigns its members. A team that still owns designs cannot be
removed, so a design is never orphaned.

## Users API

Admin-only account and role management.

| Method   | Route            | Who   | Description                                             |
| -------- | ---------------- | ----- | ------------------------------------------------------- |
| `GET`    | `/api/users`     | admin | Every account, with role and team populated             |
| `PATCH`  | `/api/users/:id` | admin | `{ "role": "student\|teacher\|admin" }` — change a role |
| `DELETE` | `/api/users/:id` | admin | Delete an account and the designs it owns               |

An admin cannot change or delete their own account, and the API refuses to
remove the last remaining admin. Moving an account off `student` clears its
team, since only students belong to one. Deleting an account also deletes its
designs and their uploaded photos.

## Designs API

Public reads only ever return `active` and `not-for-sale` designs. `pending`,
`rejected`, and `draft` designs are visible to their team and to staff.

| Method   | Route                                  | Who       | Description                                        |
| -------- | -------------------------------------- | --------- | -------------------------------------------------- |
| `GET`    | `/api/listings`                        | public    | Browse, with filters + pagination (see below)      |
| `GET`    | `/api/listings/featured`               | public    | The three newest public designs                    |
| `GET`    | `/api/listings/:slug`                  | public    | One design by slug (populates team + `similar`)    |
| `POST`   | `/api/listings`                        | signed in | Create a design (needs a team; lands in `pending`) |
| `PATCH`  | `/api/listings/:id`                    | team      | Update a design your team owns                     |
| `DELETE` | `/api/listings/:id`                    | team      | Delete a design your team owns                     |
| `GET`    | `/api/me/listings`                     | signed in | Your team's designs, any status, with counts       |
| `GET`    | `/api/moderation/listings`             | staff     | Moderation queue (`?status=pending` by default)    |
| `POST`   | `/api/moderation/listings/:id/approve` | staff     | Publish a design                                   |
| `POST`   | `/api/moderation/listings/:id/reject`  | staff     | Reject it, with `{ "reason": "…" }`                |

"team" means a teacher, the submitter, or any member of the design's team. A
student with no team cannot create a design; staff can create one without a
team.

Browse query parameters: `q` (name/description/city), `city`, `minCost`,
`maxCost`, `beds` (minimum), `sort` (`newest` \| `cost-asc` \| `cost-desc` \|
`sqft-desc`), `page`, `limit`. The response is `{ items, total, page, pageSize,
pages }`.

## Uploads API

| Method   | Route                | Who       | Description                                         |
| -------- | -------------------- | --------- | --------------------------------------------------- |
| `POST`   | `/api/uploads`       | signed in | Multipart `images` field, up to 15 files, 8 MB each |
| `DELETE` | `/api/uploads/:name` | signed in | Delete a file this app uploaded                     |

Files are written to `apps/api/uploads/` and served from `/uploads/*`. Only
image MIME types are accepted and filenames are generated, so the delete route
guards against path traversal. `apps/api/uploads/` is gitignored.

## Demo data

```sh
pnpm --filter api db:seed                          # 9 designs + 6 accounts
pnpm --filter api db:seed-history                  # 9 historical houses, not for sale
pnpm --filter api promote you@example.com teacher  # set a role: student | teacher | admin
pnpm --filter api create-admin owner@ects.org      # create/promote an admin (prints a password)
pnpm --filter api db:wipe -- --yes                 # delete every house, team and account
```

`db:seed` is for local and test databases only: it writes demo accounts
(password `password123`) and houses, and refuses to run when
`NODE_ENV=production`.

`db:wipe` empties the `listings`, `teams` and `users` collections — houses,
accounts (students and teachers) and teams — leaving a clean slate. It needs
`--yes` because it cannot be undone, and it does not touch uploaded photos.

`db:seed-history` adds the nine houses students designed before the site
existed, all owned by a single `unknown@students.ects.org` account ("Unknown
Student") and marked `not-for-sale`. They show up in the public browse but are
not on the market; the account has a random, discarded password, so nobody can
sign in as it. It creates no teams and no other accounts.

`promote` sets an existing account's role and defaults to `teacher` when none is
given. `create-admin` creates an admin account and prints a generated password,
or promotes an existing account if the email is already in use.

The seed replaces listings owned by the demo accounts and removes any leftover
accounts from earlier versions, so anything you create yourself is left alone.
It also creates the four student teams and assigns the team accounts to them.
All demo accounts use the password `password123`:

| Email                    | Role    | Team                       |
| ------------------------ | ------- | -------------------------- |
| `timberline@example.com` | student | Timberline Studio          |
| `keystone@example.com`   | student | Keystone Draft             |
| `blueridge@example.com`  | student | Blue Ridge Design          |
| `summit@example.com`     | student | Summit Works               |
| `admin@example.com`      | admin   | — (the teacher)            |
| `student@example.com`    | student | — (unassigned, no designs) |

Each seeded design belongs to one of the four student teams, and the seed
computes its `similar` links (the three closest by cost). The unassigned
`student@example.com` is handy for trying the teacher assignment flow: sign in
as `admin@example.com`, open **Manage teams**, and put them on a team.

### Photos

Real photos are the nicest, but they're optional: drop them in
`apps/api/seed-images/<folder>/` and set that folder as the design's `imagePath`
in `apps/api/src/scripts/house-catalog.ts` (the shared house data, used by both
seeders). A seeder copies them into `uploads/` under stable slug names on every
run, so reseeding does not duplicate files. When a folder is missing, `db:seed`
falls back to [picsum.photos](https://picsum.photos) placeholders (which need a
network connection to load), while `db:seed-history` leaves the gallery empty
until real photos are added — drop them in and re-run. `seed-images/` is
gitignored except for its README.

## Pages

The web app is a single page app driven by the URL hash, so every view is
linkable and the browser's back button works. Browse search terms live in the
query string, which makes a filtered list easy to share.

| Hash                              | Page                                                   |
| --------------------------------- | ------------------------------------------------------ |
| `#/`                              | Browse — the main page (unknown paths land here too)   |
| `#/listings`                      | Browse; see the query parameters below                 |
| `#/listings/:slug`                | Design detail: gallery, specs, highlights, rooms, maps |
| `#/calculator`                    | Mortgage calculator; `?price=&tax=` prefill the form   |
| `#/login`, `#/signup`             | Auth                                                   |
| `#/dashboard`                     | Signed-in overview: your counts and recent designs     |
| `#/dashboard/listings`            | Your team's designs, in every status                   |
| `#/dashboard/listings/new`        | Submit a design                                        |
| `#/dashboard/listings/:slug/edit` | Edit a design your team owns                           |
| `#/dashboard/team`                | Your team and its members                              |
| `#/dashboard/teams`               | Staff-only: create teams and assign students           |
| `#/dashboard/moderation`          | Staff-only moderation queue (approve / reject)         |
| `#/dashboard/users`               | Admin-only: manage accounts and roles                  |

Browse reads `q` and `maxCost` (set by the landing hero search), plus `beds`
and `sort`, from the query string, so `#/listings?q=barn&maxCost=600000` is a
valid, shareable URL.

The mortgage calculator reads `price` and `tax` from the query string, so a
design's detail page can link to `#/calculator?price=450000&tax=5400` with its
numbers already filled in.

Everything under `#/dashboard` requires a session, and `App.tsx` redirects
visitors who do not qualify: `#/dashboard/teams` and `#/dashboard/moderation`
need staff (a teacher or admin), and `#/dashboard/users` needs an admin.

### Submitting and moderation

Any signed-in student who is on a team can submit a design; a design belongs to
the whole team, so any member can edit or delete it. New designs start as
`pending` (or `draft`, if saved without submitting) and only appear in the public
browse list once the teacher approves them:

```
draft ──▶ pending ──▶ active
             │
             └─ rejected ──▶ pending   (team resubmits)
```

Teams can edit their own designs, move them between `draft` and `pending`, and
delete them. Only staff can set `active` or `rejected`. Editing an approved
design leaves it live, and its slug stays stable unless the name changes.

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

## Checks

```sh
pnpm --filter api typecheck
pnpm --filter api lint
pnpm --filter web build     # tsc + vite build
pnpm --filter web lint
```
