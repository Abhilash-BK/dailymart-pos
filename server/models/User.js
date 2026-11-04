const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: false,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee",
    },

    // Account activation
    isActive: {
      type: Boolean,
      default: false,
    },

    // Email verification
    emailVerified: {
      type: Boolean,
      default: false,
    },

    // Owner approval
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: {
      type: Date,
    },

    // OTP verification
    otpHash: {
      type: String,
      select: false,
    },

    otpExpiresAt: Date,

    otpAttempts: {
      type: Number,
      default: 0,
    },

    otpSentAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);