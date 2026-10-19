# Build and run ECTS Housing as a single service.
#
# Railway auto-detects this Dockerfile, so the build does not depend on
# nixpacks detecting the right pnpm/Node versions. Everything runs in one
# container: the API also serves the built web app and streams uploads out of
# MongoDB (GridFS), so no volume is needed.
FROM node:24-slim

# corepack provides the pnpm pinned by packageManager in package.json.
RUN corepack enable

WORKDIR /app

# Install dependencies first (layer cache).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# Build both apps.
COPY . .
RUN pnpm exec turbo run build --filter=api --filter=web

ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
