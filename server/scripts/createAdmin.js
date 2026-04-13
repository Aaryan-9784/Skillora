const path = require("path");
// Load .env from server/.env — works regardless of where script is run from
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI not found. Make sure server/.env exists and has MONGO_URI set.");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  const email    = process.env.ADMIN_EMAIL    || "admin@skillora.io";
  const password = process.env.ADMIN_PASSWORD || "Admin@123456";
  const name     = "Skillora Admin";

  // Dynamically require User after mongoose connects
  const User = require("../models/User");

  const hashed = await bcrypt.hash(password, 12);

  const admin = await User.findOneAndUpdate(
    { email },
    {
      name,
      email,
      password: hashed,
      role: "admin",
      isEmailVerified: true,
      provider: "local",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`✅ Admin ready: ${admin.email} (role: ${admin.role})`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
