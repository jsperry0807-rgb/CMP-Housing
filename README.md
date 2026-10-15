# Klins — Turborepo + Vite/React + Express starter

A monorepo template with a React frontend and an authenticated Express + MongoDB API.

## What's inside?

### Apps and Packages

- `web`: a [React 19](https://react.dev) + [Vite](https://vite.dev) + [Tailwind CSS 4](https://tailwindcss.com) app — a landing page (`#/`) and a dashboard (`#/dashboard`)
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

| Method | Route              | Description                                    |
| ------ | ------------------ | ---------------------------------------------- |
| `POST` | `/api/auth/signup` | Create an account, sets the session cookie     |
| `POST` | `/api/auth/login`  | Log in with email + password                   |
| `POST` | `/api/auth/logout` | Clear the session cookie                       |
| `GET`  | `/api/auth/me`     | Current user (requires the session cookie)     |
| `GET`  | `/api/health`      | Service + database status                      |

```sh
curl -c cookies.txt -X POST http://localhost:4000/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"password123"}'

curl -b cookies.txt http://localhost:4000/api/auth/me
```

Sessions are a signed JWT in an `httpOnly` cookie; `sameSite=lax`, and `secure`
in production. Passwords are hashed with bcrypt in a Mongoose `pre("save")`
hook and the `password` field is `select: false`, so it never leaves the API.

## Adding to the API

```
apps/api/src/
  models/<thing>.ts          Mongoose schema + model
  routes/<thing>.routes.ts   Express router
  routes/index.ts            mount it: apiRouter.use("/things", thingsRouter)
```

Errors thrown as `new HttpError(status, message)` are turned into JSON
responses by the shared error handler.
