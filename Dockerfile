# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build && pnpm prune --prod

FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S sentinel && adduser -S sentinel -G sentinel
COPY --from=build --chown=sentinel:sentinel /app/dist ./dist
COPY --from=build --chown=sentinel:sentinel /app/node_modules ./node_modules
COPY --from=build --chown=sentinel:sentinel /app/package.json ./package.json
USER sentinel
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8000/api/v1/health || exit 1
CMD ["node", "dist/main.js"]
