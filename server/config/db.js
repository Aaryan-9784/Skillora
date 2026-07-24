const mongoose = require("mongoose");
const dns = require("dns");
const logger = require("../utils/logger");

const attemptConnection = async (uri, options = {}) => {
  return await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    ...options,
  });
};

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const localUri = process.env.MONGO_URI_LOCAL || "mongodb://127.0.0.1:27017/skillora";

  // Attempt 1: Default DNS & primary MONGO_URI
  try {
    const conn = await attemptConnection(primaryUri);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return;
  } catch (primaryError) {
    logger.warn(`Primary MongoDB connection failed (${primaryError.message}). Attempting DNS fallback...`);
  }

  // Attempt 2: Override DNS servers (Google Public DNS) to bypass Windows local DNS SRV blocking
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    const conn = await attemptConnection(primaryUri);
    logger.info(`MongoDB connected via public DNS fallback: ${conn.connection.host}`);
    return;
  } catch (dnsError) {
    logger.warn(`Public DNS fallback attempt failed: ${dnsError.message}`);
  }

  // Attempt 3: Try Local MongoDB if configured/running
  if (localUri && localUri !== primaryUri) {
    try {
      logger.info(`Attempting local MongoDB connection fallback (${localUri})...`);
      const conn = await attemptConnection(localUri);
      logger.info(`MongoDB connected locally: ${conn.connection.host}`);
      return;
    } catch (localError) {
      logger.warn(`Local MongoDB connection fallback failed: ${localError.message}`);
    }
  }

  // Diagnostic Log Output if all connection attempts failed
  logger.error("==========================================================================");
  logger.error("MongoDB Connection Failed!");
  logger.error("--------------------------------------------------------------------------");
  logger.error(`Target URI: ${primaryUri}`);
  logger.error("Possible causes & troubleshooting steps:");
  logger.error("  1. MongoDB Atlas cluster paused/dormant: Log into https://cloud.mongodb.com and resume cluster.");
  logger.error("  2. Network Access / IP Whitelist: Ensure your current IP is allowed in Atlas Network Access.");
  logger.error("  3. Invalid Cluster Hostname: Check MONGO_URI in your server/.env file.");
  logger.error("  4. Local MongoDB: Install/start local MongoDB and set MONGO_URI=mongodb://127.0.0.1:27017/skillora in .env");
  logger.error("==========================================================================");

  process.exit(1);
};

module.exports = connectDB;

