require("./config/env"); // Validate env vars first
const http = require("http");
const app  = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./config/socket");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

const start = async () => {
  const conn = await connectDB();

  // Schedule cron jobs after DB is connected
  try {
    const cron = require("node-cron");
    const { markOverdueInvoices } = require("./jobs/markOverdue.job");
    const startMeetingCron = require("./services/meetingReminder.service");

    cron.schedule("0 0 * * *", markOverdueInvoices); // midnight daily
    markOverdueInvoices().catch(() => {});
    startMeetingCron();
  } catch (cronErr) {
    logger.warn(`Cron initialization warning: ${cronErr.message}`);
  }

  const server = http.createServer(app);

  // Initialize Socket.io
  initSocket(server);

  server.listen(PORT, () => {
    const isAtlas = conn?.connection?.host?.includes("mongodb.net");
    const dbName  = conn?.connection?.name || "skillora";
    const dbLabel = isAtlas ? `MongoDB Atlas (${dbName})` : `MongoDB Local (${dbName})`;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const c = {
      reset: "\x1b[0m",
      bold:  "\x1b[1m",
      dim:   "\x1b[2m",
      cyan:  "\x1b[36m",
      green: "\x1b[32m",
      gray:  "\x1b[90m",
    };

    // eslint-disable-next-line no-control-regex
    const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*m/g, "");
    const width = 50;

    const top    = `${c.gray}┌${"─".repeat(width)}┐${c.reset}`;
    const bottom = `${c.gray}└${"─".repeat(width)}┘${c.reset}`;
    const empty  = `${c.gray}│${" ".repeat(width)}│${c.reset}`;

    const lines = [
      `${c.bold}${c.green}Skillora Backend API${c.reset} ${c.dim}v1.0.0${c.reset}`,
      "",
      `${c.bold}• Server:   ${c.reset}${c.cyan}http://localhost:${PORT}${c.reset}`,
      `${c.bold}• Client:   ${c.reset}${c.cyan}${clientUrl}${c.reset}`,
      `${c.bold}• Database: ${c.reset}${c.green}${dbLabel}${c.reset}`,
    ];

    const content = lines.map((line) => {
      const len = stripAnsi(line).length;
      const pad = Math.max(0, width - len - 3);
      return `${c.gray}│${c.reset}   ${line}${" ".repeat(pad)}${c.gray}│${c.reset}`;
    });

    console.log(["\n", top, empty, ...content, empty, bottom, ""].join("\n"));
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
