const path          = require("path");
const express       = require("express");
const helmet        = require("helmet");
const cors          = require("cors");
const morgan        = require("morgan");
const cookieParser  = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const passport      = require("./config/passport");

const errorMiddleware = require("./middlewares/error.middleware");
const { apiLimiter }  = require("./middlewares/rateLimiter");

// Routes
const authRoutes         = require("./routes/auth.routes");
const userRoutes         = require("./routes/user.routes");
const projectRoutes      = require("./routes/project.routes");
const clientRoutes       = require("./routes/client.routes");
const invoiceRoutes      = require("./routes/invoice.routes");
const paymentRoutes      = require("./routes/payment.routes");
const skillRoutes        = require("./routes/skill.routes");
const notificationRoutes = require("./routes/notification.routes");
const dashboardRoutes    = require("./routes/dashboard.routes");
const aiRoutes           = require("./routes/ai.routes");
const adminRoutes        = require("./routes/admin.routes");
const billingRoutes      = require("./routes/billing.routes");
const uploadRoutes       = require("./routes/upload.routes");
const clientPortalRoutes = require("./routes/clientPortal.routes");
const chatRoutes         = require("./routes/chat.routes");
const meetingRoutes      = require("./routes/meeting.routes");
const escrowRoutes       = require("./routes/escrow.routes");
const reviewRoutes       = require("./routes/review.routes");
const submissionRoutes   = require("./routes/submission.routes");
const disputeRoutes      = require("./routes/dispute.routes");

const app = express();

// ── Security headers ──────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
}));

// ── CORS ──────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL,
  credentials: true,
  methods:     ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
}));

// ── Request parsing ───────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── NoSQL injection sanitization ─────────────────────────
app.use(mongoSanitize());

// ── XSS sanitization ─────────────────────────────────────
const xss = require("xss-clean");
app.use(xss());

// ── Passport (stateless) ──────────────────────────────────
app.use(passport.initialize());

// ── Logging ───────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ── Rate limiting ─────────────────────────────────────────
app.use("/api", apiLimiter);

// ── Health check ──────────────────────────────────────────
app.get("/health", (req, res) =>
  res.json({ status: "ok", env: process.env.NODE_ENV, ts: new Date().toISOString() })
);

// ── API Routes ────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/dashboard",     dashboardRoutes);
app.use("/api/projects",      projectRoutes);
app.use("/api/clients",       clientRoutes);
app.use("/api/invoices",      invoiceRoutes);
app.use("/api/payments",      paymentRoutes);
app.use("/api/skills",        skillRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai",            aiRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/billing",       billingRoutes);
app.use("/api/upload",        uploadRoutes);
app.use("/api/client",        clientPortalRoutes);
app.use("/api/chat",          chatRoutes);
app.use("/api/meetings",      meetingRoutes);
app.use("/api/calls",         meetingRoutes);
app.use("/api/escrow",        escrowRoutes);
app.use("/api/reviews",       reviewRoutes);
app.use("/api/submissions",   submissionRoutes);
app.use("/api/disputes",      disputeRoutes);

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);

// ── Global error handler ──────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
