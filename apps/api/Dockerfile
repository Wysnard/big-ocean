# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files for dependency installation
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/infrastructure/package.json ./packages/infrastructure/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/

# Install dependencies (this will install effect and other catalog dependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Re-run install to ensure workspace packages are properly linked
RUN pnpm install --frozen-lockfile

# Build the API (TypeScript compilation)
RUN pnpm --filter=api run build

# Development stage (hot reload with tsx watch)
FROM node:20-alpine AS development
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/infrastructure/package.json ./packages/infrastructure/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Copy source code and workspace packages
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Re-run install to ensure workspace packages are properly linked
RUN pnpm install --frozen-lockfile

# Expose port
EXPOSE 4000

# Install tsx globally for development
RUN npm install -g tsx

# Start with tsx watch mode for hot reload during development
CMD ["pnpm", "-C", "apps/api", "dev"]

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files for production dependencies
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/infrastructure/package.json ./packages/infrastructure/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy source code and built artifacts from builder
COPY --from=builder /app/apps/api/src ./apps/api/src
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages

# Expose port
EXPOSE 4000

# Install tsx for running TypeScript in production (temporary until contracts package is built)
RUN npm install -g tsx

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start backend using tsx (handles TypeScript imports from workspace packages)
CMD ["tsx", "apps/api/src/index.ts"]
