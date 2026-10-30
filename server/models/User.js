
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // User's unique email address
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Store only the bcrypt password hash
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    // admin = shop owner, employee = staff
    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee",
    },

    // Owner can deactivate an employee account
    isActive: {
      type: Boolean,
      default: true,
    },

    // Email verification status
    emailVerified: {
      type: Boolean,
      default: true,
    },

    // Invitation information
    inviteTokenHash: {
      type: String,
      select: false,
    },
    inviteExpiresAt: {
      type: Date,
    },

    // Password reset information
    resetTokenHash: {
      type: String,
      select: false,
    },
    resetExpiresAt: {
      type: Date,
    },

    // Records which owner created the employee account
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
