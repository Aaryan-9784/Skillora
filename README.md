# Skillora — Freelancer OS

> A production-grade SaaS platform for freelancers to manage clients, projects, tasks, invoices, payments, and AI-powered productivity — built with the MERN stack.

![Status](https://img.shields.io/badge/Status-Production%20Ready-635BFF?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-MERN-00D4FF?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Gemini%201.5%20Pro-FF6B35?style=for-the-badge)

---

## Features

- **Auth** — JWT + refresh token rotation, Google & GitHub OAuth, brute-force lockout (5 attempts → 30min), token version invalidation
- **Projects** — Kanban board with drag-and-drop (@dnd-kit), status tracking, budget, timeline, auto-progress from tasks
- **Tasks** — Priority levels, due dates, checklists, time logging, Kanban ordering, auto-syncs parent project stats
- **Clients** — Full CRM with contact info, project/invoice history, denormalized revenue stats
- **Invoices** — Line-item builder, tax/discount support, status lifecycle (draft → sent → viewed → paid → overdue)
- **Payments** — Razorpay subscription billing with webhook lifecycle handling
- **AI Assistant** — Gemini 1.5 Pro, streaming SSE responses, workspace-aware context (projects, tasks, skills, revenue)
- **Notifications** — Real-time via Socket.io, auto-expire after 90 days
- **Analytics** — Revenue charts, KPI widgets, sparklines, activity feed
- **Skills** — Proficiency tracking with level labels (beginner → expert), categories
- **Dark mode** — Persisted via Zustand, zero flash on load
- **Email** — Welcome, password reset, invoice sent, subscription events (Nodemailer)
- **File Uploads** — Cloudinary integration for avatars and attachments
- **Admin** — Admin-only endpoints for user/platform management

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access 15m + refresh 7d), Passport.js (Google, GitHub OAuth) |
| AI | Google Gemini 1.5 Pro (streaming SSE) |
| Payments | Razorpay (subscriptions + webhooks) |
| Real-time | Socket.io |
| Email | Nodemailer |
| File Upload | Cloudinary |
| Caching | Redis (optional) |
| State | Zustand |
| Charts | Recharts |
| Drag & Drop | @dnd-kit |
| Logging | Winston |
| Validation | Joi |

---

## Quick Start

### Prerequisites

- Node.js v18+
- MongoDB (local or [Atlas](https://cloud.mongodb.com))
- Git

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/skillora.git
cd skillora
```

### 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Fill in `server/.env` — minimum required:

```env
MONGO_URI=mongodb://localhost:27017/skillora
JWT_ACCESS_SECRET=your_secret_min_32_chars
JWT_REFRESH_SECRET=another_secret_min_32_chars
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend setup

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ | Min 32 chars |
| `JWT_REFRESH_SECRET` | ✅ | Min 32 chars |
| `JWT_ACCESS_EXPIRES` | — | Default: `15m` |
| `JWT_REFRESH_EXPIRES` | — | Default: `7d` |
| `CLIENT_URL` | ✅ | Frontend URL (CORS origin) |
| `NODE_ENV` | ✅ | `development` / `production` |
| `PORT` | — | Default: `5000` |
| `GOOGLE_CLIENT_ID` | OAuth | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | OAuth | Google OAuth |
| `GITHUB_CLIENT_ID` | OAuth | GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | OAuth | GitHub OAuth |
| `GEMINI_API_KEY` | AI | Google Gemini API key |
| `GEMINI_MODEL` | AI | Default: `gemini-1.5-pro` |
| `RAZORPAY_KEY_ID` | Billing | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Billing | Razorpay key secret |
| `RAZORPAY_PRO_PLAN_ID` | Billing | Pro plan ID from Razorpay dashboard |
| `RAZORPAY_PREMIUM_PLAN_ID` | Billing | Premium plan ID from Razorpay dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | Billing | Webhook signature secret |
| `EMAIL_HOST` | Email | SMTP host (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | Email | Default: `587` |
| `EMAIL_USER` | Email | SMTP username |
| `EMAIL_PASS` | Email | App password |
| `EMAIL_FROM` | Email | Sender address |
| `CLOUDINARY_CLOUD_NAME` | Upload | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Upload | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Upload | Cloudinary API secret |
| `REDIS_URL` | Cache | Optional Redis URL |

### Client (`client/.env`)

```env
VITE_API_URL=/api
```

---

## Project Structure

```
skillora/
├── client/                   # React frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── ai/           # AI chat panel, streaming, widget
│       │   ├── dashboard/    # KPI widgets, charts, activity feed
│       │   ├── projects/     # Kanban board
│       │   ├── ui/           # Reusable: Button, Modal, Input, Badge...
│       │   └── common/       # ProtectedRoute, Spinner, EmptyState
│       ├── pages/            # Route-level pages (lazy loaded)
│       │   ├── Auth/         # Login, Register, ForgotPassword, OAuth
│       │   ├── Dashboard/
│       │   ├── Projects/     # List + ProjectDetail
│       │   ├── Tasks/
│       │   ├── Clients/      # List + ClientDetail
│       │   ├── Payments/     # Invoices + InvoiceBuilder
│       │   ├── Skills/
│       │   ├── AI/
│       │   └── Settings/
│       ├── store/            # Zustand stores
│       │   ├── authStore.js
│       │   ├── projectStore.js
│       │   ├── clientStore.js
│       │   ├── invoiceStore.js
│       │   ├── aiStore.js    # SSE streaming + message history
│       │   ├── billingStore.js
│       │   ├── dashboardStore.js
│       │   ├── notificationStore.js
│       │   ├── skillStore.js
│       │   └── themeStore.js
│       ├── services/
│       │   ├── api.js        # Axios instance + silent token refresh
│       │   ├── authService.js
│       │   └── tokenStore.js # In-memory access token (never localStorage)
│       ├── hooks/            # useAuth, useFetch, useDebounce, useConfirm...
│       └── utils/            # constants, helpers, planConstants
│
└── server/                   # Express backend
    ├── app.js                # Middleware stack + route mounting
    ├── config/               # db, env, passport, plans, redis, socket, oauth
    ├── controllers/          # Thin handlers — delegate to services
    ├── middlewares/          # auth, rateLimiter, error, planGate, upload
    ├── models/               # Mongoose schemas (User, Project, Task, Client...)
    ├── routes/               # Express routers
    ├── services/             # Business logic (auth, ai, billing, email...)
    ├── utils/                # ApiError, ApiResponse, asyncHandler, logger
    └── validators/           # Joi input validation schemas
```

---

## Data Models

```
User
 ├── plan: free | pro | premium
 ├── subscription (Razorpay IDs, status, period)
 ├── skills[] → Skill
 └── preferences (currency, timezone, theme)

Project (owner → User, clientId → Client)
 ├── status: planning | active | on_hold | completed | cancelled
 ├── taskStats (denormalized: total, todo, in_progress, review, done)
 └── progress (auto-calculated from taskStats)

Task (projectId → Project, owner → User)
 ├── status: todo | in_progress | review | done
 ├── priority: low | medium | high | urgent
 ├── checklist[] (embedded)
 └── post-save hook → syncs parent Project.taskStats + progress

Client (owner → User)
 └── stats (denormalized: totalProjects, totalInvoiced, totalPaid)

Invoice (owner → User, clientId → Client, projectId → Project)
 ├── lineItems[] (embedded, immutable)
 └── status: draft | sent | viewed | paid | overdue | cancelled

Notification (recipient → User)
 ├── polymorphic ref (refModel + refId)
 └── TTL index: auto-deleted after 90 days

Skill (owner → User)
 └── level 1–100 → levelLabel (beginner/intermediate/advanced/expert)

AiLog (owner → User)
 └── tracks prompt, response, token usage, duration, model, feedback
```

All models support soft delete (`isDeleted` + `deletedAt`). Pre-find middleware excludes soft-deleted records by default.

---

## Authentication Flow

**Local (email + password):**
1. Register/login → server issues access token (15m) + refresh token (7d)
2. Both tokens set as HTTP-only cookies; access token also returned in response body
3. Frontend stores access token in memory only (`tokenStore.js`) — never localStorage
4. Axios interceptor silently calls `/auth/refresh` on 401 using the refresh cookie
5. Logout bumps `tokenVersion` → invalidates all existing tokens across devices

**OAuth (Google / GitHub):**
1. Passport authenticates → finds or creates user (merges with existing email if found)
2. Server issues JWT pair, redirects to frontend with token in URL fragment
3. `OAuthCallback` page reads token once, stores in memory, clears from URL

**Security:**
- Brute-force protection: 5 failed attempts → 30-minute lockout
- Token reuse detection: refresh token mismatch → full invalidation
- CSRF protection via `SameSite=strict` cookies
- NoSQL injection sanitization (`express-mongo-sanitize`)
- Rate limiting: 100 req/15min globally, stricter on auth endpoints
- Helmet.js security headers

---

## SaaS Plans

| Feature | Free | Pro (₹1,499/mo) | Premium (₹3,999/mo) |
|---|---|---|---|
| Projects | 3 | 25 | Unlimited |
| Clients | 5 | 50 | Unlimited |
| Invoices | 10 | 100 | Unlimited |
| AI Requests/mo | 20 | 200 | Unlimited |
| Storage | 100 MB | 2 GB | 20 GB |
| Analytics | — | ✅ | ✅ |
| Priority Support | — | — | ✅ |

---

## AI Assistant

Powered by **Google Gemini 1.5 Pro** with workspace-aware context injection.

Every request includes a compressed snapshot of the user's:
- Active projects (title, status, progress, budget)
- Open + overdue tasks (title, priority, due date)
- Skills (name, level)
- Recent revenue from paid invoices

**AI Features:**
- Streaming chat (SSE — real-time token-by-token output)
- Project plan generation (task breakdown from description)
- Client proposal writing
- Pricing strategy suggestions
- Productivity analysis
- Message history persisted to localStorage (last 100 messages)

---

## OAuth Setup

### Google
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:5000/api/auth/google/callback`

### GitHub
1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Create OAuth App
3. Set callback URL: `http://localhost:5000/api/auth/github/callback`

---

## Razorpay Setup

1. Create account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Create subscription plans for Pro and Premium, copy the plan IDs
3. Add webhook URL: `https://yourdomain.com/api/billing/webhook`
4. Enable webhook events:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
   - `payment.failed`

---

## Gemini AI Setup

1. Get API key from [aistudio.google.com](https://aistudio.google.com)
2. Add to `server/.env`: `GEMINI_API_KEY=AIza...`
3. Optionally set `GEMINI_MODEL` (default: `gemini-1.5-pro`)

---

## API Reference

<details>
<summary>Auth</summary>

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register with email + password |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/logout` | ✅ | Logout current device |
| POST | `/api/auth/logout-all` | ✅ | Logout all devices |
| POST | `/api/auth/refresh` | cookie | Refresh access token |
| GET | `/api/auth/me` | ✅ | Get current user |
| GET | `/api/auth/google` | — | Google OAuth redirect |
| GET | `/api/auth/github` | — | GitHub OAuth redirect |
| POST | `/api/auth/forgot-password` | — | Send password reset email |
| POST | `/api/auth/reset-password/:token` | — | Reset password |
</details>

<details>
<summary>Projects & Tasks</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List projects (paginated, filterable) |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Soft delete project |
| GET | `/api/projects/:id/tasks` | Get project tasks |
| POST | `/api/projects/tasks` | Create task |
| PATCH | `/api/projects/tasks/:id` | Update task |
| DELETE | `/api/projects/tasks/:id` | Delete task |
| PATCH | `/api/projects/tasks/reorder` | Reorder tasks (Kanban) |
| GET | `/api/projects/:id/ai-tasks` | AI-generated task suggestions |
</details>

<details>
<summary>Clients</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/clients` | List clients |
| POST | `/api/clients` | Create client |
| GET | `/api/clients/:id` | Get client + stats |
| PATCH | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Soft delete client |
</details>

<details>
<summary>Invoices</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices/:id` | Get invoice |
| PATCH | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| PATCH | `/api/invoices/:id/status` | Update invoice status |
</details>

<details>
<summary>AI</summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/chat` | Streaming chat (SSE) |
| POST | `/api/ai/project-plan` | Generate project task plan |
| POST | `/api/ai/proposal` | Generate client proposal |
| POST | `/api/ai/pricing` | Pricing suggestions |
| POST | `/api/ai/productivity` | Productivity analysis |
| GET | `/api/ai/history` | Chat history |
| DELETE | `/api/ai/history` | Clear chat history |
</details>

<details>
<summary>Billing</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/billing` | Get subscription info |
| POST | `/api/billing/subscribe` | Create Razorpay subscription |
| POST | `/api/billing/verify` | Verify payment signature |
| POST | `/api/billing/cancel` | Cancel subscription |
| POST | `/api/billing/webhook` | Razorpay webhook handler |
</details>

<details>
<summary>Dashboard & Notifications</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | KPIs, charts, activity feed |
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |
</details>

<details>
<summary>Skills & Users</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/skills` | List user skills |
| POST | `/api/skills` | Add skill |
| PATCH | `/api/skills/:id` | Update skill |
| DELETE | `/api/skills/:id` | Delete skill |
| GET | `/api/users/profile` | Get profile |
| PATCH | `/api/users/profile` | Update profile |
| PATCH | `/api/users/preferences` | Update preferences |
| PATCH | `/api/users/password` | Change password |
| POST | `/api/upload/avatar` | Upload avatar (Cloudinary) |
</details>

---

## License

MIT © 2025 Skillora
