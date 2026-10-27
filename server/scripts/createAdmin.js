
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function createAdmin() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!uri || !email || !password || password.length < 12) {
    throw new Error(
      "Set MongoDB URI, ADMIN_EMAIL, and a password of at least 12 characters in .env."
    );
  }

  await mongoose.connect(uri);

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    console.log("Admin account already exists; no changes made.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    email: normalizedEmail,
    passwordHash,
    role: "admin",
  });

  console.log("Admin account created successfully.");
}

createAdmin()
  .catch((error) => {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
