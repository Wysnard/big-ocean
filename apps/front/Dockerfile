# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files for dependency installation
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/ui/package.json ./packages/ui/
COPY packages/lint/package.json ./packages/lint/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/front/package.json ./apps/front/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY apps/front/ ./apps/front/

# Build the frontend
RUN pnpm --filter=front run build

# Development stage (Vite dev server with HMR)
FROM node:20-alpine AS development
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/ui/package.json ./packages/ui/
COPY packages/lint/package.json ./packages/lint/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/front/package.json ./apps/front/

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Copy source code and workspace packages
COPY packages/ ./packages/
COPY apps/front/ ./apps/front/

# Expose port for Vite dev server
EXPOSE 3000

# Set NODE_ENV
ENV NODE_ENV=development

# Start Vite dev server with --host for Docker networking
CMD ["pnpm", "-C", "apps/front", "dev", "--host"]

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files for dependency installation
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/ui/package.json ./packages/ui/
COPY packages/lint/package.json ./packages/lint/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/front/package.json ./apps/front/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY apps/front/ ./apps/front/

# Build the frontend
RUN pnpm --filter=front run build

# Final production runtime
FROM node:20-alpine
WORKDIR /app

# Install Node.js dependencies needed at runtime
RUN npm install -g pnpm@10.4.1

# Copy package files for dependency resolution
COPY --from=production /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=production /app/packages ./packages
COPY --from=production /app/apps/front/package.json ./apps/front/

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built Nitro output
COPY --from=production /app/apps/front/.output ./.output

# Expose Railway's default port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Start the Nitro server
CMD ["node", ".output/server/index.mjs"]
