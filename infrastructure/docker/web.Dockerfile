# Near By Web — Next.js frontend, standalone output for a slim runtime image.
#   docker build -f infrastructure/docker/web.Dockerfile -t near-by-web .

FROM node:20-alpine AS base
WORKDIR /app

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
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=@near-by/web

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD wget -qO- http://localhost:3000/ || exit 1
CMD ["node", "apps/web/server.js"]
