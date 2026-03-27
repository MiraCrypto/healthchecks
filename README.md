# Healthchecks (Minimalist Implementation)

A dead-simple, zero-boilerplate, strongly-typed monitoring tool. Set up simple HTTP checks, Ping them with cronjobs, and view their statuses.

## Tech Stack
- **Monorepo**: npm workspaces
- **Shared**: Zod schemas & types (`@healthchecks/shared`)
- **Backend**: Fastify + Drizzle ORM (SQLite / PostgreSQL)
- **Frontend**: Vite + React + Radix UI Themes

---

## Local Development (SQLite)

For local development, the system defaults to a flat-file SQLite database (`data.db`) for zero-dependency overhead.

### 1. Install Dependencies
```bash
cd healthchecks
npm install
```

### 2. Initialize Database (SQLite)
Generate the `data.db` SQLite database using Drizzle Kit:
```bash
cd backend
npm run db:push
```

### 3. Start Development Servers
You can run both the Fastify backend and Vite frontend simultaneously from the root directory:
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000` (Proxy automatically handles `/api` and `/ping` calls from the frontend)

---

## Production Deployment (PostgreSQL + Node)

For production, the backend is designed to swap to **PostgreSQL** purely using environment variables, requiring exactly zero code changes.

### Environment Variables (`backend/.env`)
```bash
PORT=3000
NODE_ENV=production
DB_DIALECT=postgres
DATABASE_URL=postgres://user:password@localhost:5432/healthchecks
JWT_SECRET=your_super_secret_key
```

### 1. Build the Application
```bash
# Build Shared Types, Backend, and Frontend
npm run build
```

### 2. Push Database Schema to PostgreSQL
Instead of `db:push` (which uses SQLite), use the PostgreSQL configuration:
```bash
cd backend
npm run db:push:pg
```

### 3. Run Production Server
Serve the frontend statically or behind Nginx, and run the backend using standard Node:
```bash
cd backend
npm start
```

### Recommended Docker Architecture
Since this implementation avoids heavy frontend meta-frameworks, you can simply deploy the `frontend/dist` folder to any CDN or Nginx server, and run the `backend` container mapped to a standard Postgres instance.
