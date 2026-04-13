const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const mongoose = require("mongoose");

async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI not found in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "asp22356@gmail.com";

  // Find the admin user first so we can preserve it
  const User = require("../models/User");
  const admin = await User.findOne({ email: ADMIN_EMAIL, role: "admin" });

  if (!admin) {
    console.warn(`⚠️  Admin user (${ADMIN_EMAIL}) not found — run createAdmin.js first`);
  } else {
    console.log(`🔒 Preserving admin: ${admin.email}`);
  }

  // Delete all users EXCEPT the admin
  const userResult = await User.deleteMany(
    admin ? { _id: { $ne: admin._id } } : {}
  );
  console.log(`🗑️  Deleted ${userResult.deletedCount} users`);

  // Delete all other collections
  const collections = [
    "projects",
    "tasks",
    "clients",
    "invoices",
    "payments",
    "notifications",
    "skills",
    "counters",
    "aisessions",
    "ailogs",
    "subscriptions",
  ];

  for (const name of collections) {
    try {
      const col = mongoose.connection.collection(name);
      const result = await col.deleteMany({});
      console.log(`🗑️  Cleared ${name}: ${result.deletedCount} documents`);
    } catch {
      // Collection may not exist yet — skip silently
    }
  }

  console.log("\n✅ Database cleaned. Admin account preserved.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
