const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const authenticateToken = require("../middleware/authenticateToken");
const { sendOtpEmail } = require("../config/mailer");

const router = express.Router();

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

// --------------------------------------
// 1. LOGIN
// --------------------------------------

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = req.body.password;

    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Enter your email and password.",
      });
    }

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);

    if (!matches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email first.",
      });
    }

    if (user.role === "employee" && user.approvalStatus !== "approved") {
      return res.status(403).json({
        message:
          user.approvalStatus === "rejected"
            ? "Your registration was rejected. Contact the owner."
            : "Your account is waiting for owner approval.",
        approvalStatus: user.approvalStatus,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive. Contact the owner.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from server/.env");
    }

    const token = jwt.sign(
      { sub: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

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

// --------------------------------------
// 2. EMPLOYEE SELF-REGISTRATION
// --------------------------------------

router.post("/register", async (req, res) => {
  let employee;

  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const otp = crypto
      .randomInt(0, 1000000)
      .toString()
      .padStart(6, "0");

    employee = await User.create({
      email,
      role: "employee",
      isActive: false,
      emailVerified: false,
      approvalStatus: "pending",
      otpHash: hashOtp(otp),
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      otpAttempts: 0,
      otpSentAt: new Date(),
    });

    await sendOtpEmail(email, otp);

    return res.status(201).json({
      message: "Verification code sent to your email.",
      email,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (employee) {
      await User.findByIdAndDelete(employee._id).catch(() => {});
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      message: "Unable to register. Please try again.",
    });
  }
});
// --------------------------------------
// RESEND OTP
// --------------------------------------

router.post("/resend-otp", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Enter your email address.",
      });
    }

    const employee = await User.findOne({
      email,
      role: "employee",
      emailVerified: false,
      approvalStatus: "pending",
    });

    if (!employee) {
      return res.status(404).json({
        message: "No pending email verification found.",
      });
    }

    if (
      employee.otpSentAt &&
      Date.now() - employee.otpSentAt.getTime() < 60 * 1000
    ) {
      return res.status(429).json({
        message: "Please wait one minute before requesting another OTP.",
      });
    }

    const otp = crypto
      .randomInt(0, 1000000)
      .toString()
      .padStart(6, "0");

    employee.otpHash = hashOtp(otp);
    employee.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    employee.otpAttempts = 0;
    employee.otpSentAt = new Date();

    await employee.save();
    await sendOtpEmail(email, otp);

    return res.json({
      message: "A new verification code has been sent.",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);

    return res.status(500).json({
      message: "Unable to resend verification code.",
    });
  }
});

// --------------------------------------
// 3. VERIFY OTP AND SET PASSWORD
// --------------------------------------

router.post("/verify-otp", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = req.body.otp;
    const password = req.body.password;

    if (
      !email ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp) ||
      typeof password !== "string" ||
      password.length < 12
    ) {
      return res.status(400).json({
        message:
          "Enter your email, six-digit OTP, and a password of at least 12 characters.",
      });
    }

    const employee = await User.findOne({
      email,
      role: "employee",
      emailVerified: false,
      approvalStatus: "pending",
    }).select("+otpHash");

    if (!employee || !employee.otpHash || !employee.otpExpiresAt) {
      return res.status(400).json({
        message: "No pending verification found. Please register again.",
      });
    }

    if (employee.otpExpiresAt <= new Date()) {
      return res.status(400).json({
        message: "OTP expired. Please register again.",
      });
    }

    if (employee.otpAttempts >= 5) {
      return res.status(429).json({
        message: "Too many incorrect attempts. Please register again.",
      });
    }

    const submittedHash = hashOtp(otp);

    const matches = crypto.timingSafeEqual(
      Buffer.from(employee.otpHash, "hex"),
      Buffer.from(submittedHash, "hex")
    );

    if (!matches) {
      employee.otpAttempts += 1;

      if (employee.otpAttempts >= 5) {
        employee.otpHash = undefined;
        employee.otpExpiresAt = undefined;
      }

      await employee.save();

      return res.status(400).json({
        message: "Incorrect OTP.",
      });
    }

    employee.passwordHash = await bcrypt.hash(password, 12);
    employee.emailVerified = true;

    // Verification does NOT activate the employee.
    // Owner approval is still required.
    employee.isActive = false;
    employee.approvalStatus = "pending";

    employee.otpHash = undefined;
    employee.otpExpiresAt = undefined;
    employee.otpAttempts = 0;
    employee.otpSentAt = undefined;

    await employee.save();

    return res.json({
      message:
        "Email verified successfully. Your account is waiting for owner approval.",
      approvalStatus: "pending",
    });
  } catch (error) {
    console.error("OTP verification error:", error);

    return res.status(500).json({
      message: "Unable to verify your email.",
    });
  }
});

// --------------------------------------
// 4. OWNER: VIEW PENDING EMPLOYEES
// --------------------------------------

router.get("/pending-employees", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only the owner can view registration requests.",
      });
    }

    const employees = await User.find({
      role: "employee",
      approvalStatus: "pending",
    })
      .select("email emailVerified approvalStatus createdAt")
      .sort({ createdAt: -1 });

    return res.json({ employees });
  } catch (error) {
    console.error("Pending employees error:", error);

    return res.status(500).json({
      message: "Unable to load employee requests.",
    });
  }
});

// --------------------------------------
// 5. OWNER: APPROVE EMPLOYEE
// --------------------------------------

router.patch("/approve-employee/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only the owner can approve employees.",
      });
    }

    const employee = await User.findOne({
      _id: req.params.id,
      role: "employee",
      emailVerified: true,
      approvalStatus: "pending",
    });

    if (!employee) {
      return res.status(404).json({
        message: "Verified pending employee not found.",
      });
    }

    employee.approvalStatus = "approved";
    employee.isActive = true;
    employee.approvedBy = req.user.id;
    employee.approvedAt = new Date();

    await employee.save();

    return res.json({
      message: "Employee approved successfully.",
      employee: {
        id: employee._id,
        email: employee.email,
        approvalStatus: employee.approvalStatus,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    console.error("Employee approval error:", error);

    return res.status(500).json({
      message: "Unable to approve employee.",
    });
  }
});

// --------------------------------------
// 6. OWNER: REJECT EMPLOYEE
// --------------------------------------

router.patch("/reject-employee/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only the owner can reject employees.",
      });
    }

    const employee = await User.findOne({
      _id: req.params.id,
      role: "employee",
      approvalStatus: "pending",
    });

    if (!employee) {
      return res.status(404).json({
        message: "Pending employee not found.",
      });
    }

    employee.approvalStatus = "rejected";
    employee.isActive = false;

    employee.otpHash = undefined;
    employee.otpExpiresAt = undefined;
    employee.otpAttempts = 0;

    await employee.save();

    return res.json({
      message: "Employee registration rejected.",
    });
  } catch (error) {
    console.error("Employee rejection error:", error);

    return res.status(500).json({
      message: "Unable to reject employee.",
    });
  }
});

module.exports = router;