# DailyFlow Backend

REST API for [DailyFlow](../dailyflow), a habit tracker app. Built with **NestJS**, **Prisma**, and **PostgreSQL**.

## Features

### Current

- User registration and login (email/password)
- Guest login endpoint (in progress)
- JWT access + refresh token auth
- Logout and token refresh
- Authenticated user profile
- Swagger API docs at `/docs`
- Prisma schema for habits, streaks, XP, achievements, challenges, and more

### Planned

- Habit CRUD and completion tracking
- Reminders and notifications
- Analytics and daily summaries
- Social challenges
- Premium subscriptions

## Tech Stack

- **NestJS** + TypeScript
- **Prisma** (PostgreSQL)
- **Passport** (JWT + local strategies)
- **bcrypt** for password hashing
- **Swagger** (`@nestjs/swagger`)
- **class-validator** / **class-transformer**

## Prerequisites

- Node.js (LTS recommended)
- pnpm
- PostgreSQL

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_ACCESS_TOKEN_SECRET=your-access-secret
JWT_ACCESS_TOKEN_EXPIRATION_TIME=15m
JWT_REFRESH_TOKEN_SECRET=your-refresh-secret
JWT_REFRESH_TOKEN_EXPIRATION_TIME=7d
PORT=3000
```

### 3. Database

Generate the Prisma client and run migrations:

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

### 4. Run the server

```bash
# development (watch mode)
pnpm run dev

# production build
pnpm run build
pnpm run start:prod
```

The API listens on `http://localhost:3000` by default.  
Swagger docs: `http://localhost:3000/docs`

## API Overview

| Method | Path              | Auth     | Description                |
|--------|-------------------|----------|----------------------------|
| GET    | `/`               | Public   | Health / hello             |
| POST   | `/auth/register`  | Public   | Register a new user        |
| POST   | `/auth/login`     | Public   | Login with email/password  |
| POST   | `/auth/login/guest` | Public | Login as guest             |
| POST   | `/auth/refresh`   | Refresh  | Refresh access token       |
| POST   | `/auth/logout`    | JWT      | Invalidate refresh token   |
| GET    | `/profile`        | JWT      | Get current user profile   |

JWT is required globally except on routes marked `@Public()`.  
Send the access token as `Authorization: Bearer <token>`.  
Refresh uses the refresh token via the refresh auth guard.

### Register body

```json
{
  "email": "user@example.com",
  "name": "Alice",
  "password": "password1",
  "confirmPassword": "password1"
}
```

### Login body

```json
{
  "email": "user@example.com",
  "password": "password1"
}
```

Auth responses return `{ "access_token": "...", "refresh_token": "..." }`.

## Project Structure

```text
src/
  auth/           # Auth module (controllers, guards, strategies, DTOs)
  users/          # User service
  common/         # Shared interceptors
  prisma.service.ts
  main.ts         # Bootstrap, validation pipe, Swagger
prisma/
  schema.prisma   # Database schema
  migrations/     # Prisma migrations
generated/        # Generated Prisma client
```

## Scripts

```bash
pnpm run dev          # Start in watch mode
pnpm run start        # Start once
pnpm run start:prod   # Run compiled build
pnpm run build        # Compile TypeScript
pnpm run lint         # ESLint
pnpm run test         # Unit tests
pnpm run test:e2e     # E2E tests
pnpm run test:cov     # Coverage
```

## License

Private / unlicensed (`UNLICENSED` in `package.json`).
