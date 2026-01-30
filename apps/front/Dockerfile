# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files for dependency installation
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/front/package.json ./apps/front/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY apps/front/ ./apps/front/

# Build the frontend
RUN pnpm --filter=front run build

# Runtime stage
FROM node:20-alpine
WORKDIR /app

# Copy built output from Nitro build
COPY --from=builder /app/apps/front/.output /app/.output

# Expose port (TanStack Start/Nitro default is 3000)
EXPOSE 3000

# Set NODE_ENV
ENV NODE_ENV=production

# Start the Nitro server
CMD ["node", ".output/server/index.mjs"]
