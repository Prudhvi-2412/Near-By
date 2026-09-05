# Near By API — multi-stage build for the main NestJS service.
# Build context must be the monorepo root, e.g.:
#   docker build -f infrastructure/docker/api.Dockerfile -t near-by-api .

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package.json package-lock.json ./
COPY services/api/package.json services/api/package.json
COPY services/transport-service/package.json services/transport-service/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/events/package.json packages/events/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
RUN npm install --workspaces --include-workspace-root=false --omit=optional

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build --workspace=@near-by/api

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/services/api/dist ./services/api/dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY packages ./packages

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "services/api/dist/main.js"]
