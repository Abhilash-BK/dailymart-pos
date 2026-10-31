
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = req.body.password;

    // Validate input
    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Enter your email and password.",
      });
    }

    // Find account and retrieve password hash
    const user = await User.findOne({ email }).select("+passwordHash");

    // Do not reveal whether the email exists
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Verify password
    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Reject deactivated accounts
    // Missing fields are allowed temporarily for legacy accounts.
    if (user.isActive === false) {
      return res.status(403).json({
        message: "Your account is deactivated. Contact the owner.",
      });
    }

    // Reject explicitly unverified accounts
    if (user.emailVerified === false) {
      return res.status(403).json({
        message: "Please verify your email before signing in.",
      });
    }

    // Only these roles are supported
    if (!["admin", "employee"].includes(user.role)) {
      return res.status(403).json({
        message: "Your account does not have valid access.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from server/.env");
    }

    // Create JWT
    const token = jwt.sign(
      {
        sub: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    // Return authenticated user information
    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to sign in.",
    });
  }
});

module.exports = router;
