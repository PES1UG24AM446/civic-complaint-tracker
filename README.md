# Civic Complaint & Incident Tracking System

This project is a Next.js application for civic complaint tracking with SLA-based escalation. It uses PostgreSQL for relational data and MongoDB for variable-shape incident metadata.

## Features
- Citizen registration and complaint submission with category + priority + location metadata
- Full-text search and status/priority/category filtering for complaint lists
- Officer department dashboard, ownership assignment, and SLA visibility
- Admin management for departments, hierarchy, categories, users, SLA rules, reports, and overdue escalations
- Live PostgreSQL-backed homepage counts for open, at-risk, and escalated complaints
- PostgreSQL triggers, procedure, views, and escalation logic with MongoDB comment threads
- Comment edit/delete support and MongoDB aggregation summary endpoints

## Tech stack
- Next.js 14 (App Router)
- PostgreSQL
- MongoDB
- JWT authentication with httpOnly cookies
- TypeScript, React, pg, mongodb, bcryptjs, jsonwebtoken

## Setup (macOS, Linux, or Windows)
Requirements: Node.js 20 or later, PostgreSQL, and MongoDB (local or hosted).

1. Install dependencies:
   ```sh
   npm install
   ```
2. Create `.env.local` from the example and replace the placeholder secrets:
   ```sh
   cp .env.example .env.local
   ```
   On Windows PowerShell, use `Copy-Item .env.example .env.local`. Set these values in `.env.local`:
   - `DATABASE_URL` — PostgreSQL connection string
   - `MONGODB_URI` — MongoDB connection string
   - `JWT_SECRET` — random secret used to sign the auth cookie (at least 32 bytes)
   - `SEED_PASSWORD` — password used for seeded demo accounts
   - `TEST_DATABASE_URL` — optional PostgreSQL admin connection for integration tests; must be allowed to create and drop databases
3. Create the PostgreSQL database and apply the schema from the root SQL file:
   ```sh
   createdb civic_db
   psql "postgresql://localhost:5432/civic_db" -f schema.sql
   ```
4. Create the initial admin account (only allowed when no admin exists). The script loads `DATABASE_URL` from the environment:
   ```sh
   $env:ADMIN_NAME = "Project Admin"
   $env:ADMIN_EMAIL = "admin@example.com"
   $env:ADMIN_PASSWORD = "Set-a-strong-password-here"
   npm run create-admin
   Remove-Item Env:ADMIN_NAME, Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD
   ```
   On macOS/Linux:
   ```sh
   export ADMIN_NAME="Project Admin"
   export ADMIN_EMAIL="admin@example.com"
   export ADMIN_PASSWORD="Set-a-strong-password-here"
   npm run create-admin
   unset ADMIN_NAME ADMIN_EMAIL ADMIN_PASSWORD
   ```
5. Seed demo data (optional):
   ```sh
   npm run seed
   ```
   The script reads `SEED_PASSWORD` from `.env.local`, seeds demo departments, users, categories, complaint records, and Mongo comments, and refuses to run in production. Keep the seed password private; it is not printed by the script.
6. Demonstrate database-level RBAC on a throwaway database (optional):
   ```sh
   psql "$DATABASE_URL" -f scripts/rbac-demo.sql
   ```
   This is a defense-in-depth exercise; the app’s primary enforcement remains JWT + Route Handler checks.
7. Start the app:
   ```sh
   npm run dev
   ```

MongoDB creates the `comments` collection on first comment write. Comment documents remain linked to PostgreSQL complaints by `complaint_id`.

## Available scripts
- `npm run dev` — start the Next.js dev server
- `npm run build` — production build
- `npm run lint` — Next.js lint
- `npm run test:integration` — integration test suite for auth, role checks, complaints, SLA, Mongo, and escalation flows
- `npm run create-admin` — create the first admin when no admin exists
- `npm run seed` — demo seed script for departments, categories, sample users, and sample complaints
- `npm run ddl-demo` — schema + migration + scratch-table DDL demo; set `DATABASE_URL` to a disposable empty database
- `npm run escalate` — run the escalation demo path for overdue complaints

## Verification

```sh
npm run build
npm run lint
npx tsc --noEmit
```

Integration checks must use a disposable database and are run like this:

```sh
$env:TEST_DATABASE_URL = "postgresql://localhost:5432/postgres"
$env:MONGODB_URI = "mongodb://localhost:27017/civic_db"
npm run test:integration
```

The scripts load `.env.local` automatically. Environment variables set in the shell override values from the file. On Unix shells, an explicit one-off setup can also be used:
```sh
TEST_DATABASE_URL=postgresql://localhost:5432/postgres \
MONGODB_URI=mongodb://localhost:27017/civic_db \
npm run test:integration
```

## Project ownership
- Rohan: complaints API, escalations API, complaints pages, officer dashboard
- Harsha: auth, departments, comments, admin, registration pages

## Database note
The SQL schema is maintained in `schema.sql` and follows the course brief for relational integrity and escalation rules. The MongoDB layer is for flexible complaint detail documents and comment threads.

## Reference docs
- [docs/api-contract.md](./docs/api-contract.md)
- [docs/project-report.md](./docs/project-report.md)
- [docs/evidence](./docs/evidence)
