# Skillora — Freelancer OS

> A production-grade SaaS platform for freelancers to manage clients, projects, tasks, invoices, payments, and AI-powered productivity — built with the MERN stack.

![Status](https://img.shields.io/badge/Status-Production%20Ready-635BFF?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-MERN-00D4FF?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Gemini%201.5%20Pro-FF6B35?style=for-the-badge)

---

## Features

- **Landing Page** — Premium cinematic landing page with video background, animated hero, product preview tabs, pricing, and footer
- **Auth** — JWT + refresh token rotation, Google & GitHub OAuth, brute-force lockout, token version invalidation
- **Projects** — Kanban board with drag-and-drop (@dnd-kit), status tracking, budget, timeline, auto-progress from tasks
- **Tasks** — Priority levels, due dates, checklists, time logging, Kanban ordering
- **Clients** — Full CRM with contact info, project/invoice history, denormalized revenue stats
- **Invoices** — Line-item builder, tax/discount support, full status lifecycle
- **Payments** — Razorpay subscription billing with webhook lifecycle handling
- **AI Assistant** — Gemini 1.5 Pro, streaming SSE responses, workspace-aware context
- **Notifications** — Real-time via Socket.io, auto-expire after 90 days
- **Analytics** — Revenue charts, KPI widgets, sparklines, activity feed
- **Skills** — Proficiency tracking with level labels
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
| Auth | JWT (access 2h + refresh 30d), Passport.js (Google, GitHub OAuth) |
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
```

Create `server/.env` — minimum required:

```env
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000
MONGO_URI=mongodb://localhost:27017/skillora
JWT_ACCESS_SECRET=your_secret_min_32_chars
JWT_REFRESH_SECRET=another_secret_min_32_chars
JWT_ACCESS_EXPIRES=2h
JWT_REFRESH_EXPIRES=30d
CLIENT_URL=http://localhost:5173
```

```bash
nodemon server.js
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

## Project Structure

```
skillora/
├── client/                   # React frontend (Vite)
│   ├── public/
│   │   └── videos/           # Local video assets (signup-bg.mp4, login-bg.mp4)
│   └── src/
│       ├── components/
│       │   ├── ai/           # AI chat panel, streaming, widget
│       │   ├── dashboard/    # KPI widgets, charts, activity feed
│       │   ├── projects/     # Kanban board
│       │   ├── ui/           # Reusable: Button, Modal, Input, Badge...
│       │   └── common/       # ProtectedRoute, Spinner, EmptyState
│       ├── pages/
│       │   ├── Landing/      # Premium landing page with video hero
│       │   ├── Auth/         # Login, Register, ForgotPassword, OAuth
│       │   ├── Dashboard/
│       │   ├── Projects/
│       │   ├── Tasks/
│       │   ├── Clients/
│       │   ├── Payments/
│       │   ├── Skills/
│       │   ├── AI/
│       │   └── Settings/
│       ├── store/            # Zustand stores
│       ├── services/
│       │   ├── api.js        # Axios + silent token refresh + session expiry guard
│       │   ├── authService.js
│       │   └── tokenStore.js # In-memory access token (never localStorage)
│       ├── hooks/
│       └── utils/
│
└── server/                   # Express backend
    ├── app.js
    ├── config/               # db, env, passport, plans, redis, socket, oauth
    ├── controllers/
    ├── middlewares/          # auth, rateLimiter, error, planGate, upload
    ├── models/               # User, Project, Task, Client, Invoice, ...
    ├── routes/
    ├── services/             # auth, ai, billing, email, ...
    ├── utils/                # ApiError, ApiResponse, asyncHandler, logger
    └── validators/
```

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ | Min 32 chars |
| `JWT_REFRESH_SECRET` | ✅ | Min 32 chars |
| `JWT_ACCESS_EXPIRES` | — | Default: `2h` |
| `JWT_REFRESH_EXPIRES` | — | Default: `30d` |
| `CLIENT_URL` | ✅ | Frontend URL (CORS origin) |
| `SERVER_URL` | ✅ | Backend URL (used for OAuth callbacks) |
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
| `RAZORPAY_WEBHOOK_SECRET` | Billing | Webhook signature secret |
| `EMAIL_HOST` | Email | SMTP host |
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
VITE_SERVER_URL=http://localhost:5000
```

---

## OAuth Setup

### Google
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
4. Add authorized JavaScript origin: `http://localhost:5000`

### GitHub
1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Create OAuth App
3. Set callback URL: `http://localhost:5000/api/auth/github/callback`

---

## SaaS Plans

| Feature | Free | Pro (₹1,499/mo) | Premium (₹3,999/mo) |
|---|---|---|---|
| Projects | 3 | 25 | Unlimited |
| Clients | 5 | 50 | Unlimited |
| Invoices | 10 | 100 | Unlimited |
| AI Requests/mo | 20 | 200 | Unlimited |
| Analytics | — | ✅ | ✅ |
| Custom Domain | — | — | ✅ |
| Priority Support | — | — | ✅ |

---

## Authentication Flow

**Local:**
1. Register/login → server issues access token (2h) + refresh token (30d) as HTTP-only cookies
2. Frontend stores access token in memory only — never localStorage
3. Axios interceptor silently calls `/auth/refresh` on 401
4. Session expiry toast shown only when user was previously authenticated (not on public pages)

**OAuth (Google / GitHub):**
1. User clicks OAuth button → redirected directly to `SERVER_URL/api/auth/google`
2. Passport authenticates → issues JWT pair → redirects to `/oauth/callback#token=...`
3. Frontend reads token from fragment, stores in memory, clears from URL

---

## Razorpay Setup

1. Create account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Create subscription plans for Pro and Premium
3. Add webhook URL: `https://yourdomain.com/api/billing/webhook`
4. Enable events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `payment.failed`

---

## License

MIT © 2025 Skillora
