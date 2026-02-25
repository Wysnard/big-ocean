# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install latest pnpm
RUN npm install -g pnpm@latest

# Copy package files for dependency installation
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/domain/package.json ./packages/domain/
COPY packages/infrastructure/package.json ./packages/infrastructure/
COPY packages/ui/package.json ./packages/ui/
COPY packages/lint/package.json ./packages/lint/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/

# Install dependencies (this will install effect and other catalog dependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Copy Drizzle migration files (needed by production stage)
COPY drizzle/ ./drizzle/

# Development stage (hot reload with tsx watch)
FROM node:20-alpine AS development
WORKDIR /app

# Install latest pnpm
RUN npm install -g pnpm@latest && corepack enable

# Copy package files for dependency installation
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/domain/package.json ./packages/domain/
COPY packages/infrastructure/package.json ./packages/infrastructure/
COPY packages/ui/package.json ./packages/ui/
COPY packages/lint/package.json ./packages/lint/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/

# Install all dependencies (including dev, tsx, and optional platform binaries)
RUN pnpm install --frozen-lockfile --include-workspace-root

# Explicitly install platform-specific esbuild binary to workspace root
RUN pnpm add -D -w @esbuild/linux-arm64@0.27.2

# Rebuild esbuild for the container's platform (Linux Alpine)
# This ensures the native binary matches the container architecture
RUN pnpm rebuild esbuild

# Copy source code and workspace packages
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Copy drizzle config and migration files for db:migrate in entrypoint
COPY drizzle.config.ts ./
COPY drizzle/ ./drizzle/

# Copy entrypoint script
COPY apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 4000

# Use entrypoint to rebuild esbuild after volumes are mounted
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["pnpm", "-C", "apps/api", "dev"]

# Production build stage - use pnpm deploy for monorepo
FROM builder AS deploy
WORKDIR /app

# Use pnpm deploy to create isolated production deployment of api package
# This copies api and all workspace dependencies into /app/prod with proper linking
# Using --legacy flag for compatibility with pnpm v10 workspace handling
RUN pnpm --filter=api --prod deploy --legacy prod

# Production runtime stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy deployed package from deploy stage (includes isolated node_modules)
COPY --from=deploy /app/prod .

# Copy Drizzle migration SQL files for runtime migration
# migrate.ts resolves these relative to its own location: ../../drizzle
COPY --from=deploy /app/drizzle ./drizzle

# Set NODE_ENV to production
ENV NODE_ENV=production

# Expose Railway's default port (but app reads from PORT env var)
EXPOSE 8080

# Install tsx for running TypeScript directly in production
RUN npm install -g tsx

# Health check using wget (more reliable than inline Node.js)
RUN apk add --no-cache wget
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT:-8080}/health || exit 1

# Run migrations then start the API server
CMD ["sh", "-c", "tsx src/migrate.ts && tsx src/index.ts"]
