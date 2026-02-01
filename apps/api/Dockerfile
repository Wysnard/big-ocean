# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files for dependency installation
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
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

# Re-run install to ensure workspace packages are properly linked
RUN pnpm install --frozen-lockfile

# Development stage (hot reload with tsx watch)
FROM node:20-alpine AS development
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1 && corepack enable

# Copy package files for dependency installation
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/domain/package.json ./packages/domain/
COPY packages/infrastructure/package.json ./packages/infrastructure/
COPY packages/ui/package.json ./packages/ui/
COPY packages/lint/package.json ./packages/lint/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/

# Install all dependencies (including dev, including tsx)
RUN pnpm install --frozen-lockfile

# Copy source code and workspace packages
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Re-run install to ensure workspace packages are properly linked and tsx is available
RUN pnpm install --frozen-lockfile

# Expose port
EXPOSE 4000

# Start with pnpm dev (uses tsx watch mode from package.json)
CMD ["pnpm", "-C", "apps/api", "dev"]

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/domain/package.json ./packages/domain/
COPY packages/infrastructure/package.json ./packages/infrastructure/
COPY packages/ui/package.json ./packages/ui/
COPY packages/lint/package.json ./packages/lint/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/

# First install to get dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY --from=builder /app/apps/api/src ./apps/api/src
COPY --from=builder /app/packages ./packages

# Re-install to link workspace packages properly (simple-git-hooks skips when no .git dir)
RUN pnpm install --frozen-lockfile

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

# Start backend using tsx (handles TypeScript imports from workspace packages)
CMD ["tsx", "apps/api/src/index.ts"]
