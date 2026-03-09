# WhateverOPS — Single-container image (backend + frontend)
# Build: docker build -t whateverops .
# Run:   docker run -p 3000:3000 --env-file .env whateverops

# ── Stage 1: Build frontend ─────────────────────────────────────────────────
FROM oven/bun:1 AS frontend-build

WORKDIR /app

# Install root + frontend deps
COPY package.json pnpm-workspace.yaml ./
COPY frontend/package.json frontend/
COPY packages/ packages/
RUN bun install --frozen-lockfile

# Build frontend
COPY frontend/ frontend/
COPY tsconfig.json ./
RUN cd frontend && bun run build

# ── Stage 2: Build backend ──────────────────────────────────────────────────
FROM oven/bun:1 AS backend-build

WORKDIR /app

# Install root + backend deps
COPY package.json pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY packages/ packages/
RUN bun install --frozen-lockfile

# Copy backend source
COPY backend/ backend/
COPY tsconfig.json ./

# ── Stage 3: Runtime ────────────────────────────────────────────────────────
FROM oven/bun:1-slim

WORKDIR /app

# Copy backend with deps
COPY --from=backend-build /app/backend/ backend/
COPY --from=backend-build /app/packages/ packages/
COPY --from=backend-build /app/node_modules/ node_modules/
COPY --from=backend-build /app/package.json ./

# Copy built frontend to be served by backend
COPY --from=frontend-build /app/frontend/dist/ frontend/dist/

ENV NODE_ENV=production
ENV PORT=3000
ENV CACHE_BACKEND=memory

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["bun", "run", "backend/src/index.ts"]
