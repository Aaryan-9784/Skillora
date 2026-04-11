# Skillora — Freelancer OS

> A production-grade SaaS platform for freelancers to manage clients, projects, tasks, invoices, payments, and AI-powered productivity — built with the MERN stack.

![Skillora Dashboard](https://img.shields.io/badge/Status-Production%20Ready-635BFF?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-MERN-00D4FF?style=for-the-badge)

---

## ✨ Features

- **Auth** — JWT + Refresh Tokens, Google & GitHub OAuth, brute-force protection
- **Projects** — Kanban board with drag-and-drop (dnd-kit), progress tracking
- **Tasks** — Priority, due dates, checklist, auto-sync project progress
- **Clients** — Full CRM with project/invoice history
- **Invoices** — Line-item builder, auto-totals, PDF-ready
- **Payments** — Razorpay subscription billing (Free / Pro / Premium)
- **AI Assistant** — Gemini 1.5 Pro, streaming responses, context-aware
- **Notifications** — Real-time via Socket.io
- **Analytics** — Revenue charts, KPI widgets, sparklines
- **Dark mode** — Persisted, zero flash on load
- **Email** — Nodemailer (welcome, password reset, invoice, subscription)

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT, Passport.js (Google, GitHub OAuth) |
| AI | Google Gemini 1.5 Pro |
| Payments | Razorpay |
| Real-time | Socket.io |
| Email | Nodemailer |
| File Upload | Cloudinary |
| Caching | Redis (optional) |
| State | Zustand |
| Charts | Recharts |
| Drag & Drop | @dnd-kit |

---

## 🚀 Quick Start

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

## ⚙️ Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ | Min 32 chars |
| `JWT_REFRESH_SECRET` | ✅ | Min 32 chars |
| `CLIENT_URL` | ✅ | Frontend URL |
| `GOOGLE_CLIENT_ID` | OAuth | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | OAuth | Google OAuth |
| `GITHUB_CLIENT_ID` | OAuth | GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | OAuth | GitHub OAuth |
| `GEMINI_API_KEY` | AI | Google Gemini API |
| `GEMINI_MODEL` | AI | Default: `gemini-1.5-pro` |
| `RAZORPAY_KEY_ID` | Billing | Razorpay key |
| `RAZORPAY_KEY_SECRET` | Billing | Razorpay secret |
| `RAZORPAY_PRO_PLAN_ID` | Billing | Pro plan ID |
| `RAZORPAY_PREMIUM_PLAN_ID` | Billing | Premium plan ID |
| `RAZORPAY_WEBHOOK_SECRET` | Billing | Webhook secret |
| `EMAIL_HOST` | Email | SMTP host (e.g. smtp.gmail.com) |
| `EMAIL_PORT` | Email | Default: 587 |
| `EMAIL_USER` | Email | SMTP username |
| `EMAIL_PASS` | Email | App password |
| `EMAIL_FROM` | Email | Sender address |
| `CLOUDINARY_CLOUD_NAME` | Upload | Cloudinary |
| `CLOUDINARY_API_KEY` | Upload | Cloudinary |
| `CLOUDINARY_API_SECRET` | Upload | Cloudinary |
| `REDIS_URL` | Cache | Optional Redis URL |

### Client (`client/.env`)

```env
VITE_API_URL=/api
```

---

## 📁 Project Structure

```
skillora/
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route pages
│       ├── store/          # Zustand stores
│       ├── services/       # API + token management
│       ├── hooks/          # Custom hooks
│       └── utils/          # Helpers + constants
│
└── server/                 # Express backend
    ├── config/             # DB, Redis, Passport, Socket.io
    ├── controllers/        # Route handlers
    ├── middlewares/        # Auth, rate limit, upload, plan gate
    ├── models/             # Mongoose schemas
    ├── routes/             # Express routers
    ├── services/           # Business logic
    ├── utils/              # ApiError, ApiResponse, logger
    └── validators/         # Joi input validation
```

---

## 🔐 OAuth Setup

### Google
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:5000/api/auth/google/callback`

### GitHub
1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Create OAuth App
3. Set callback URL: `http://localhost:5000/api/auth/github/callback`

---

## 💳 Razorpay Setup

1. Create account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Create subscription plans for Pro and Premium
3. Add webhook URL: `https://yourdomain.com/api/billing/webhook`
4. Enable events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `payment.failed`

---

## 🤖 Gemini AI Setup

1. Get API key from [aistudio.google.com](https://aistudio.google.com)
2. Add to `.env`: `GEMINI_API_KEY=AIza...`

---

## 📦 API Reference

<details>
<summary>Auth</summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/auth/google` | Google OAuth |
| GET | `/api/auth/github` | GitHub OAuth |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password/:token` | Reset password |
</details>

<details>
<summary>Projects & Tasks</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/tasks` | Project tasks |
| POST | `/api/projects/tasks` | Create task |
| PATCH | `/api/projects/tasks/:id` | Update task |
| DELETE | `/api/projects/tasks/:id` | Delete task |
| GET | `/api/projects/:id/ai-tasks` | AI task suggestions |
</details>

<details>
<summary>Billing</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/billing` | Subscription info |
| POST | `/api/billing/subscribe` | Create subscription |
| POST | `/api/billing/verify` | Verify payment |
| POST | `/api/billing/cancel` | Cancel subscription |
| POST | `/api/billing/webhook` | Razorpay webhook |
</details>

---

## 📄 License

MIT © 2025 Skillora
