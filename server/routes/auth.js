
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const authenticateToken = require("../middleware/authenticateToken");
const { sendInvitationEmail } = require("../config/mailer");






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

// Owner-only employee invitation
// POST /api/auth/invite
router.post("/invite", authenticateToken, async (req, res) => {
  try {
    // Only the owner can invite employees
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only the shop owner can invite employees.",
      });
    }

    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    // Prevent duplicate accounts
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Generate a secure random invitation token
    const invitationToken = crypto.randomBytes(32).toString("hex");

    // Store only its SHA-256 hash
    const inviteTokenHash = crypto
      .createHash("sha256")
      .update(invitationToken)
      .digest("hex");

    const inviteExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    // Create a pending employee account
    const employee = await User.create({
      email,
      role: "employee",
      isActive: false,
      emailVerified: false,
      inviteTokenHash,
      inviteExpiresAt,
      createdBy: req.user.id,
    });

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      await User.findByIdAndDelete(employee._id);
      throw new Error("FRONTEND_URL is missing from server/.env");
    }

    const invitationLink =
      `${frontendUrl}/accept-invite?token=${invitationToken}`;

    try {
      await sendInvitationEmail(email, invitationLink);
    } catch (mailError) {
      // Do not leave an account with an invitation that was never sent
      await User.findByIdAndDelete(employee._id);
      throw mailError;
    }

    return res.status(201).json({
      message: "Employee invitation sent successfully.",
      employee: {
        id: employee._id,
        email: employee.email,
        role: employee.role,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    console.error("Employee invitation error:", error.message);

    return res.status(500).json({
      message: "Unable to send employee invitation.",
    });
  }
});


// Accept invitation and create employee password
// POST /api/auth/accept-invite
router.post("/accept-invite", async (req, res) => {
  try {
    const bcrypt = require("bcryptjs");

    const token = req.body.token;
    const password = req.body.password;

    if (
      typeof token !== "string" ||
      typeof password !== "string" ||
      password.length < 12
    ) {
      return res.status(400).json({
        message: "Provide a valid invitation and a password of at least 12 characters.",
      });
    }

    const inviteTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const employee = await User.findOne({
      inviteTokenHash,
      inviteExpiresAt: { $gt: new Date() },
      role: "employee",
      isActive: false,
    }).select("+inviteTokenHash");

    if (!employee) {
      return res.status(400).json({
        message: "This invitation is invalid, expired, or already used.",
      });
    }

    // Set the employee's own password
    employee.passwordHash = await bcrypt.hash(password, 12);
    employee.emailVerified = true;
    employee.isActive = true;

    // Remove invitation details so the link cannot be reused
    employee.inviteTokenHash = undefined;
    employee.inviteExpiresAt = undefined;

    await employee.save();

    return res.json({
      message: "Your account is ready. You can now sign in.",
    });
  } catch (error) {
    console.error("Invitation acceptance error:", error.message);

    return res.status(500).json({
      message: "Unable to accept invitation.",
    });
  }
});

module.exports = router;
