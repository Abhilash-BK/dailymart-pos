const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Please sign in.",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload.sub) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    const user = await User.findById(payload.sub).select(
      "email role isActive emailVerified approvalStatus"
    );

    if (!user) {
      return res.status(401).json({
        message: "Account not found. Please sign in again.",
      });
    }

   
if (!["admin", "employee"].includes(user.role)) {
  return res.status(403).json({
    message: "Access denied.",
  });
}

if (user.role === "admin" && !user.isActive) {
  return res.status(403).json({
    message: "Admin account is inactive.",
  });
}

if (user.role === "employee") {
  if (!user.emailVerified || !user.isActive) {
    return res.status(403).json({
      message: "Your account is not active.",
    });
  }

  if (user.approvalStatus !== "approved") {
    return res.status(403).json({
      message: "Your account is waiting for owner approval.",
    });
  }
}


    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Session expired. Please sign in again.",
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Authentication failed.",
    });
  }
}

module.exports = authenticateToken;