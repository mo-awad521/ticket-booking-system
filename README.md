# Ticket Booking System

A RESTful API backend for an event ticket booking platform. Built with **NestJS**, **TypeORM**, and **MySQL**, supporting the full booking lifecycle from event creation to QR-coded ticket generation.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Modules](#api-modules)
- [Database](#database)
- [Authentication Flow](#authentication-flow)
- [Booking Flow](#booking-flow)

---

## Overview

This system provides the backend infrastructure for a multi-role event ticketing platform. It supports three user roles: **User** (attendee), **Organizer** (event creator), and **Admin** (platform manager).

Key design decisions:
- **Pessimistic locking** on ticket inventory to prevent overselling under concurrent requests
- **Two-phase booking** (reservation → order) with time-limited holds and automatic expiration via cron
- **Refresh token rotation** with reuse detection and per-session revocation
- **Soft delete** for events to preserve historical order and ticket records

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 (TypeScript) |
| Database | MySQL 8 via TypeORM 0.3 |
| Auth | JWT (access + refresh tokens), Passport |
| Queue | BullMQ + Redis |
| Email | Nodemailer + @nestjs-modules/mailer (Handlebars templates) |
| Image Upload | Cloudinary |
| QR Codes | `qrcode` package |
| Real-time | Socket.IO (WebSocket gateway) |
| Scheduling | @nestjs/schedule (Cron jobs) |
| Rate Limiting | @nestjs/throttler |
| Package Manager | pnpm |

---

## Features

### Authentication
- Register with email verification
- Login with access token + refresh token pair
- Refresh token rotation with reuse detection (all sessions revoked on replay)
- Forgot / reset password via email
- Multiple active sessions with per-session revocation
- Cron-based cleanup of expired tokens

### Users
- View and update profile
- Change password
- Self-deactivation

### Events (Organizer)
- Create events with optional image upload (Cloudinary)
- Full lifecycle management: `DRAFT` → `PUBLISHED` → `CANCELLED` / `FINISHED`
- Slug auto-generation with uniqueness guarantee
- Soft delete for draft events

### Ticket Types (Organizer)
- Create multiple ticket types per event with configurable sale windows
- Inventory tracking: `quantity`, `soldQuantity`, `reservedQuantity`
- Business rule enforcement (cannot modify after sales begin, etc.)
- Public listing filters active sale window and available stock

### Reservations
- Pessimistic write lock on ticket inventory during reservation
- Configurable expiration window (default: 10 minutes)
- Cron job runs every minute to expire stale reservations and release held stock

### Orders
- Convert active reservation into a pending order
- Order has its own TTL (default: 15 minutes)
- Snapshot unit prices at order creation time

### Payments
- Payment intent creation (mock provider included, pluggable via interface)
- Payment confirmation with idempotency checks inside a transaction
- Automatic ticket generation on successful payment

### Tickets
- Unique QR code per ticket (UUID-based code, uploaded to Cloudinary)
- Idempotency guard: re-triggering ticket generation returns existing tickets
- Paginated "my tickets" endpoint with event and ticket type details

### Analytics
- Per-event stats: total sold, checked in, pending check-in, check-in rate
- Real-time updates via Socket.IO gateway (`/analytics` namespace)
- JWT-authenticated WebSocket connections

### Admin Panel
- User management: list, view, update role/status, suspend, activate
- Event management: list, view, force-cancel with reason
- Order management: list and view
- Ticket management: list and view
- System-wide statistics and revenue breakdown by period (day/week/month)
- Audit log for all admin actions
- CSV export for users and orders
- Rate-limited write operations

---

## Project Structure

```
src/
├── common/
│   ├── decorators/         # @CurrentUser, @Roles
│   ├── entities/           # BaseEntity (id, createdAt, updatedAt)
│   ├── enums/              # UserRole
│   ├── filters/            # TransformInterceptor (unified response shape)
│   ├── guards/             # JwtAuthGuard, RolesGuard, AccountStatusGuard
│   └── interceptors/       # GlobalExceptionFilter
│
├── database/
│   ├── data-source.ts      # TypeORM DataSource (used by migrations)
│   └── migrations/
│
└── modules/
    ├── auth/               # JWT auth, token management, verification
    ├── users/              # Profile, password, account status
    ├── events/             # Event CRUD, publish/cancel lifecycle
    ├── ticket-types/       # Inventory management per event
    ├── reservations/       # Holds with expiration
    ├── orders/             # Order creation from reservation
    ├── payments/           # Payment intent + confirmation
    ├── tickets/            # QR ticket generation and retrieval
    ├── notifications/      # Email service (Handlebars templates)
    ├── analytics/          # Event stats + WebSocket gateway
    ├── media/              # Cloudinary upload/delete
    └── admin/              # Admin controllers and facade service
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm
- MySQL 8
- Redis 7

### 1. Start infrastructure with Docker

```bash
docker compose up -d
```

This starts MySQL on port `3306` and Redis on port `6379`.

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 4. Run database migrations

```bash
pnpm run migration:run
```

### 5. Start the development server

```bash
pnpm run start:dev
```

The API will be available at `http://localhost:5000`.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USERNAME` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | — |
| `DB_NAME` | Database name | `ticket_booking` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | Access token secret | — |
| `JWT_REFRESH_SECRET` | Refresh token secret | — |
| `TICKET_QR_SECRET` | QR code signing secret | — |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP user | — |
| `EMAIL_PASS` | SMTP password / app token | — |
| `MAIL_FROM` | Sender display name + address | `"App <no-reply@app.com>"` |
| `EMAIL_VERIFICATION_URL` | Base URL for email verify link | `http://localhost:5000/auth/verify-email` |
| `PASSWORD_RESET_URL` | Base URL for password reset link | `http://localhost:5000/auth/reset-password` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | — |
| `CLOUDINARY_API_KEY` | Cloudinary API key | — |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | — |
| `RESERVATION_EXPIRY_MINUTES` | Reservation hold duration | `10` |
| `ORDER_TTL_MINUTES` | Order payment window | `15` |
| `CORS_ORIGIN` | Allowed frontend origin(s) | `http://localhost:5173` |

---

## API Modules

| Prefix | Description | Auth Required |
|---|---|---|
| `POST /auth/register` | Register a new account | No |
| `GET /auth/verify-email` | Verify email via token | No |
| `POST /auth/login` | Login and receive tokens | No |
| `POST /auth/refresh` | Rotate refresh token | No |
| `POST /auth/forgot-password` | Request password reset email | No |
| `POST /auth/reset-password` | Reset password via token | No |
| `POST /auth/logout` | Revoke current session | Yes |
| `GET /auth/sessions` | List active sessions | Yes |
| `GET /users/me` | Get own profile | Yes |
| `PATCH /users/me` | Update own profile | Yes |
| `GET /events/public` | List published events | No |
| `POST /events` | Create event | Organizer |
| `PATCH /events/:id/publish` | Publish a draft event | Organizer |
| `PATCH /events/:id/cancel` | Cancel a published event | Organizer |
| `GET /events/:eventId/ticket-types` | List available ticket types | No |
| `POST /reservations` | Reserve tickets | User |
| `POST /orders` | Convert reservation to order | User |
| `POST /payments/:orderId/intent` | Create payment intent | User |
| `POST /payments/:paymentId/confirm` | Confirm payment | User |
| `GET /tickets/my` | Get own tickets | User |
| `GET /admin/users` | List all users | Admin |
| `GET /admin/stats` | System statistics | Admin |
| `GET /admin/stats/revenue` | Revenue by period | Admin |
| `GET /admin/audit-logs` | Admin action audit log | Admin |

---

## Database

TypeORM migrations are used exclusively (`synchronize: false` in production).

**Migration commands:**

```bash
# Generate a migration from entity changes
pnpm run migration:generate src/database/migrations/MigrationName

# Apply pending migrations
pnpm run migration:run

# Revert the last migration
pnpm run migration:revert
```

**Core entities:** `User`, `Event`, `TicketType`, `Reservation`, `ReservationItem`, `Order`, `OrderItem`, `Payment`, `Ticket`, `RefreshToken`, `UserVerificationToken`, `AdminAuditLog`

---

## Authentication Flow

```
Register → [Email Verification] → Login
              ↓
         Access Token (short-lived) + Refresh Token (long-lived)
              ↓
         Access Token expires → POST /auth/refresh → New token pair
              ↓
         Old refresh token is immediately revoked (rotation)
         Reuse of revoked token → All sessions revoked
```

---

## Booking Flow

```
1. Browse published events          GET /events/public
2. View available ticket types      GET /events/:id/ticket-types
3. Create reservation               POST /reservations
   └─ Inventory held with pessimistic lock
   └─ Expires in RESERVATION_EXPIRY_MINUTES if not completed
4. Convert to order                 POST /orders
   └─ Prices snapshotted
   └─ Expires in ORDER_TTL_MINUTES if not paid
5. Create payment intent            POST /payments/:orderId/intent
6. Confirm payment                  POST /payments/:paymentId/confirm
   └─ Order marked PAID
   └─ QR-coded tickets generated
7. View tickets                     GET /tickets/my
```

---

## Scripts

```bash
pnpm run start:dev       # Development server with watch mode
pnpm run start:prod      # Production server (requires build)
pnpm run build           # Compile TypeScript
pnpm run lint            # Lint and auto-fix
pnpm run format          # Format with Prettier
pnpm run test            # Unit tests
pnpm run test:e2e        # End-to-end tests
pnpm run test:cov        # Test coverage report
```

---

## License

UNLICENSED — private project.
