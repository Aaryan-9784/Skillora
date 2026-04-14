<div align="center">

<img src="https://img.shields.io/badge/Skillora-Freelancer%20OS-635BFF?style=for-the-badge&logoColor=white" alt="Skillora" />

# Skillora — Freelancer OS

**A production-grade SaaS platform for freelancers.**  
Manage clients, projects, tasks, invoices, payments, and AI-powered productivity — all in one workspace.

<br/>

[![Status](https://img.shields.io/badge/Status-Production%20Ready-22C55E?style=flat-square)](.)
[![Stack](https://img.shields.io/badge/Stack-MERN-00D4FF?style=flat-square)](.)
[![AI](https://img.shields.io/badge/AI-Gemini%201.5%20Pro-FF6B35?style=flat-square)](.)
[![Payments](https://img.shields.io/badge/Payments-Razorpay-3395FF?style=flat-square)](.)
[![License](https://img.shields.io/badge/License-MIT-A78BFA?style=flat-square)](.)

<br/>

[Features](#-features) · [Tech Stack](#-tech-stack) · [Quick Start](#-quick-start) · [Project Structure](#-project-structure) · [Environment Variables](#-environment-variables) · [Auth Flow](#-authentication-flow) · [Plans](#-saas-plans)

</div>

---

## ✨ Features

### 🔐 Authentication & Security
- JWT access tokens (2h) + refresh token rotation (30d) via HTTP-only cookies
- Google & GitHub OAuth via Passport.js
- Brute-force lockout, token version invalidation, silent refresh on 401
- Access token stored **in-memory only** — never `localStorage`

### 📊 Dashboard & Analytics
- KPI widgets, sparkline charts, earnings overview (Recharts)
- Activity feed, real-time notifications via Socket.io
- Revenue analytics with period comparison

### 📁 Projects & Tasks
- Kanban board with drag-and-drop (`@dnd-kit`)
- Task priority, due dates, checklists, time logging
- Auto-progress calculation from task completion
- Budget and timeline tracking per project

### 👥 Clients (CRM)
- Full client profiles with contact info, notes, tags
- Project and invoice history per client
- Denormalized revenue stats for fast queries

### 🧾 Invoices & Payments
- Line-item invoice builder with tax and discount support
- Full status lifecycle: Draft → Sent → Paid → Overdue
- Razorpay subscription billing with webhook lifecycle handling
- Pro (₹1,499/mo) and Premium (₹3,999/mo) plans

### 🤖 AI Assistant
- Powered by Google Gemini 1.5 Pro
- Streaming SSE responses with typing cursor
- Workspace-aware context (projects, tasks, clients)
- Floating widget + full-page chat panel
- AI-suggested task generation per project

### 🎨 UI & Experience
- Premium glassmorphism design system
- Video backgrounds on auth pages
- Framer Motion micro-interactions throughout
- Dark mode persisted via Zustand (zero flash)
- Command palette, global search, notifications panel
- Fully responsive — mobile to desktop

### 🛠 Admin Panel
- User management, platform revenue overview
- Admin-only routes with role-based access control
- Admin profile page with security settings

### 📧 Email & Uploads
- Transactional emails: welcome, password reset, invoice sent, subscription events (Nodemailer)
- Cloudinary integration for avatars and file attachments

### 🔗 Client Portal
- Separate login for clients to view their projects and invoices
- Invite flow with secure token-based access

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS v3, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT (access 2h + refresh 30d), Passport.js (Google, GitHub) |
| **AI** | Google Gemini 1.5 Pro — streaming SSE |
| **Payments** | Razorpay — subscriptions + webhooks |
| **Real-time** | Socket.io |
| **Email** | Nodemailer (SMTP) |
| **File Upload** | Cloudinary + Multer |
| **Caching** | Redis via ioredis (optional) |
| **State** | Zustand |
| **Charts** | Recharts |
| **Drag & Drop** | @dnd-kit |
| **Validation** | Joi |
| **Logging** | Winston |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize, xss-clean |

---

## 🚀 Quick Start

### Prerequisites

- Node.js **v18+**
- MongoDB (local or [Atlas](https://cloud.mongodb.com))
- Git

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/skillora.git
cd skillora
```

### 2. Backend

```bash
cd server
npm install
```

Create `server/.env` (minimum required):

```env
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

MONGO_URI=mongodb://localhost:27017/skillora

JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRES=2h
JWT_REFRESH_EXPIRES=30d
```

```bash
npm run dev
# → http://localhost:5000
```

### 3. Frontend

```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

---

## 📁 Project Structure

```
skillora/
├── client/                        # React + Vite frontend
│   ├── public/
│   │   └── videos/                # Video backgrounds (login, signup, landing)
│   └── src/
│       ├── components/
│       │   ├── ai/                # Chat panel, widget, streaming, quick actions
│       │   ├── dashboard/         # KPI widgets, charts, activity feed, navbar
│       │   ├── projects/          # Kanban board
│       │   ├── ui/                # Button, Modal, Input, Badge, Tabs, Tooltip...
│       │   └── common/            # ProtectedRoute, AdminRoute, Spinner, PlanGate
│       ├── pages/
│       │   ├── Landing/           # Cinematic landing page
│       │   ├── Auth/              # Login, Register, ForgotPassword, ResetPassword, OAuth
│       │   ├── Dashboard/
│       │   ├── Projects/          # List + ProjectDetail
│       │   ├── Tasks/
│       │   ├── Clients/           # List + ClientDetail (CRM)
│       │   ├── Payments/          # Invoice list, builder, detail
│       │   ├── Skills/
│       │   ├── AI/                # Full AI chat page
│       │   ├── Settings/          # Profile, security, billing, appearance, notifications
│       │   ├── Admin/             # Overview, Users, Revenue, Settings, Profile
│       │   └── ClientPortal/      # Client-facing dashboard, invoices, projects
│       ├── layouts/               # DashboardLayout, AdminLayout, ClientLayout, MainLayout
│       ├── store/                 # Zustand: auth, ai, billing, client, dashboard, invoice...
│       ├── services/
│       │   ├── api.js             # Axios + silent token refresh + session expiry guard
│       │   ├── authService.js
│       │   ├── tokenStore.js      # In-memory access token (never localStorage)
│       │   └── socketService.js
│       ├── hooks/                 # useAuth, useSocket, useSyncEvents, useDebounce...
│       └── utils/                 # helpers, planConstants
│
└── server/                        # Express backend
    ├── app.js
    ├── server.js
    ├── config/                    # db, env, passport, plans, redis, socket, oauth
    ├── controllers/               # auth, project, task, client, invoice, ai, admin...
    ├── middlewares/               # auth, rateLimiter, error, planGate, upload
    ├── models/                    # User, Project, Task, Client, Invoice, Payment, Skill...
    ├── routes/                    # One file per resource
    ├── services/                  # auth, ai, billing, email, project, dashboard...
    ├── utils/                     # ApiError, ApiResponse, asyncHandler, logger, notify
    └── validators/                # Joi schemas for auth, project, task
```

---

## 🔑 Environment Variables

### Server — `server/.env`

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ | Min 32 chars |
| `JWT_REFRESH_SECRET` | ✅ | Min 32 chars |
| `JWT_ACCESS_EXPIRES` | — | Default: `2h` |
| `JWT_REFRESH_EXPIRES` | — | Default: `30d` |
| `CLIENT_URL` | ✅ | Frontend origin (CORS) |
| `SERVER_URL` | ✅ | Backend URL (OAuth callbacks) |
| `NODE_ENV` | ✅ | `development` / `production` |
| `PORT` | — | Default: `5000` |
| `GOOGLE_CLIENT_ID` | OAuth | Google OAuth app ID |
| `GOOGLE_CLIENT_SECRET` | OAuth | Google OAuth secret |
| `GITHUB_CLIENT_ID` | OAuth | GitHub OAuth app ID |
| `GITHUB_CLIENT_SECRET` | OAuth | GitHub OAuth secret |
| `GEMINI_API_KEY` | AI | Google Gemini API key |
| `GEMINI_MODEL` | AI | Default: `gemini-1.5-pro` |
| `RAZORPAY_KEY_ID` | Billing | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Billing | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Billing | Webhook signature verification |
| `EMAIL_HOST` | Email | SMTP host (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | Email | Default: `587` |
| `EMAIL_USER` | Email | SMTP username |
| `EMAIL_PASS` | Email | App password |
| `EMAIL_FROM` | Email | Sender display address |
| `CLOUDINARY_CLOUD_NAME` | Upload | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Upload | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Upload | Cloudinary API secret |
| `REDIS_URL` | Cache | Optional — Redis connection URL |

### Client — `client/.env`

```env
VITE_API_URL=/api
VITE_SERVER_URL=http://localhost:5000
```

---

## 🔐 Authentication Flow

### Local (Email + Password)

```
Register / Login
      ↓
Server issues:
  • Access token (2h)  → memory only (tokenStore.js)
  • Refresh token (30d) → HTTP-only cookie
      ↓
Axios interceptor catches 401
      ↓
Silent POST /auth/refresh → new access token
      ↓
Session expired? → toast + redirect to /login
```

### OAuth (Google / GitHub)

```
Click OAuth button
      ↓
Redirect → SERVER_URL/api/auth/google (or /github)
      ↓
Passport authenticates → issues JWT pair
      ↓
Redirect → /oauth/callback#token=...
      ↓
Frontend reads token from URL fragment
Stores in memory, clears from URL
```

---

## 💳 SaaS Plans

| Feature | Free | Pro | Premium |
|---|---|---|---|
| **Price** | Free | ₹1,499/mo | ₹3,999/mo |
| Projects | 3 | 25 | Unlimited |
| Clients | 5 | 50 | Unlimited |
| Invoices | 10 | 100 | Unlimited |
| AI Requests/mo | 20 | 200 | Unlimited |
| Analytics | — | ✅ | ✅ |
| Custom Domain | — | — | ✅ |
| Priority Support | — | — | ✅ |

Payments via **Razorpay** · Prices in INR · Cancel anytime

---

## 🔗 OAuth Setup

### Google
1. [console.cloud.google.com](https://console.cloud.google.com) → Create OAuth 2.0 credentials
2. Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
3. Authorized JS origin: `http://localhost:5000`

### GitHub
1. [github.com/settings/developers](https://github.com/settings/developers) → New OAuth App
2. Callback URL: `http://localhost:5000/api/auth/github/callback`

---

## 💸 Razorpay Setup

1. Create account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Create subscription plans for Pro and Premium
3. Add webhook: `https://yourdomain.com/api/billing/webhook`
4. Enable events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `payment.failed`

---

## 🛡 Security Highlights

- Helmet for HTTP security headers
- Rate limiting on auth routes (express-rate-limit)
- MongoDB injection prevention (express-mongo-sanitize)
- XSS sanitization (xss-clean)
- CORS locked to `CLIENT_URL`
- Refresh tokens stored as HTTP-only, Secure, SameSite=Strict cookies
- Token version field on User model — invalidates all sessions on password change

---

## 📜 License

MIT © 2025 Skillora
