# Better Auth Integration

Complete frontend-backend authentication integration using Better Auth with Express.js.

## Architecture

### Backend (Express.js)
- **Framework**: Express.js 5
- **Auth**: Better Auth 1.4.18
- **Database**: PostgreSQL with Drizzle ORM
- **Routes**: `/api/auth/*`

### Frontend (TanStack Start)
- **Framework**: React 19 + TanStack Start
- **Auth Client**: better-auth/react
- **Routes**: `/login`, `/signup`, `/dashboard`

## Backend Endpoints

Better Auth automatically provides these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-up/email` | POST | Create new account |
| `/api/auth/sign-in/email` | POST | Sign in with credentials |
| `/api/auth/sign-out` | POST | Sign out current user |
| `/api/auth/get-session` | GET | Get current session |

### Request Examples

**Sign Up**:
```bash
curl -X POST http://localhost:4000/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "User Name"
  }'
```

**Sign In**:
```bash
curl -X POST http://localhost:4000/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

**Get Session**:
```bash
curl http://localhost:4000/api/auth/get-session \
  -H 'Cookie: better-auth.session_token=...'
```

## Frontend Integration

### 1. Auth Client Setup

Located in `apps/front/src/lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
});

export const { signUp, signIn, signOut, useSession } = authClient;
```

### 2. Auth Hook

Located in `apps/front/src/hooks/use-auth.ts`:

```typescript
import { useAuth } from "./hooks/use-auth";

function MyComponent() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();

  if (isAuthenticated) {
    return <div>Welcome {user.name}</div>;
  }

  return <button onClick={() => signIn.email(email, password)}>Sign In</button>;
}
```

### 3. Components

**Login Form**: `apps/front/src/components/auth/login-form.tsx`
- Email/password input
- Error handling
- Redirect on success

**Signup Form**: `apps/front/src/components/auth/signup-form.tsx`
- Email/password/name input
- Password confirmation
- Validation

**User Menu**: `apps/front/src/components/auth/user-menu.tsx`
- Display user info
- Sign out button
- Loading states

### 4. Routes

**Login**: `/login`
```typescript
import { LoginForm } from "../components/auth";
```

**Signup**: `/signup`
```typescript
import { SignupForm } from "../components/auth";
```

**Dashboard (Protected)**: `/dashboard`
```typescript
import { useRequireAuth } from "../hooks/use-auth";

function Dashboard() {
  const { user } = useRequireAuth("/login"); // Redirects if not authenticated
  return <div>Welcome {user.name}</div>;
}
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://dev:devpassword@localhost:5432/bigocean
BETTER_AUTH_SECRET=mQ+W1tYzPem0vKK5RrUajJvLA7Jhy34+wI6pwMnEMZs=
BETTER_AUTH_URL=http://localhost:4000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000
```

## Setup & Testing

### 1. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 2. Start Backend

```bash
pnpm dev --filter=api
```

Backend runs on http://localhost:4000

### 3. Start Frontend

```bash
pnpm dev --filter=front
```

Frontend runs on http://localhost:3000

### 4. Test Flow

1. Navigate to http://localhost:3000/signup
2. Create an account
3. Get redirected to /dashboard
4. See your user info
5. Click "Sign Out"
6. Get redirected to /login

## Security Features

✅ **Automatic Cookie Handling** - Better Auth manages session cookies
✅ **CSRF Protection** - Built-in CSRF token validation
✅ **Secure Cookies** - HttpOnly, Secure, SameSite flags
✅ **Password Hashing** - Bcrypt by default
✅ **Session Management** - 7-day expiry, auto-refresh
✅ **CORS Protection** - Configured for frontend origin

## Database Schema

Better Auth creates these tables:

- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth providers (if enabled)
- `verification` - Email verification tokens

## Type Safety

All auth operations are fully type-safe:

```typescript
import type { Session, User } from "./hooks/use-auth";

const session: Session = useSession().data;
const user: User = session.user;
```

## Troubleshooting

**Can't connect to database**:
- Ensure PostgreSQL is running: `docker compose ps`
- Check DATABASE_URL in .env

**CORS errors**:
- Verify VITE_API_URL matches backend URL
- Check backend CORS configuration in `apps/api/src/index.ts`

**Session not persisting**:
- Check browser cookies (should see `better-auth.session_token`)
- Verify BETTER_AUTH_SECRET is set

**Password too short error**:
- Better Auth requires minimum 8 characters
- Check password validation in forms

## Next Steps

- [ ] Add email verification
- [ ] Add password reset flow
- [ ] Add OAuth providers (Google, GitHub)
- [ ] Add two-factor authentication
- [ ] Add rate limiting
- [ ] Add session management UI

## Resources

- [Better Auth Docs](https://better-auth.com/docs)
- [Better Auth React](https://better-auth.com/docs/frameworks/react)
- [Express.js](https://expressjs.com/)
- [TanStack Start](https://tanstack.com/start)
