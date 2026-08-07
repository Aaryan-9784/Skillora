require("./config/env"); // Validate env vars first
const http = require("http");
const app  = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./config/socket");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // Schedule cron jobs after DB is connected
  const cron = require("node-cron");
  const { markOverdueInvoices } = require("./jobs/markOverdue.job");
  const startMeetingCron = require("./services/meetingReminder.service");

  cron.schedule("0 0 * * *", markOverdueInvoices); // midnight daily
  markOverdueInvoices(); // run once on startup
  startMeetingCron();    // 15-min meeting reminder cron

  const server = http.createServer(app);

  // Initialize Socket.io
  initSocket(server);

  server.listen(PORT, () => {
    logger.info(`Skillora API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));

  process.on("unhandledRejection", (err) => {
    logger.error(`Unhandled rejection: ${err.message}`);
    if (err.code !== "ECONNRESET" && err.code !== "EPIPE") {
      // Don't crash server on transient socket resets
    }
  });
};

start();
