# Local Development with Docker Compose

Your existing Docker Compose setup works **exactly** as production:

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: big_ocean
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://dev:dev@postgres:5432/big_ocean
      REDIS_URL: redis://redis:6379
      BETTER_AUTH_SECRET: dev-secret
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      NODE_ENV: development

  frontend:
    build:
      context: ./apps/front
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://backend:4000

volumes:
  postgres_data:
```

**Local Workflow:**

```bash
# Start everything locally
docker-compose up -d

# Backend available at: http://localhost:4000
# Frontend available at: http://localhost:3001
# PostgreSQL at: localhost:5432 (user: dev, pass: dev)
# Redis at: localhost:6379

# Run migrations locally
pnpm -C apps/api drizzle-kit push

# Develop normally
pnpm dev

# Logs
docker-compose logs -f backend
```

**Parity with Production:**
- ✅ Same PostgreSQL version (16)
- ✅ Same Redis version (7)
- ✅ Same Node.js runtime (Railway uses your Dockerfile)
- ✅ Same environment variables (Railway → .env)
- ✅ Same dependencies

---
