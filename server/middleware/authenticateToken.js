
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Please sign in." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role !== "admin" || !payload.sub) {
      return res.status(403).json({ message: "Access denied." });
    }

    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({
      message: "Session expired. Please sign in again.",
    });
  }
}

module.exports = authenticateToken;
