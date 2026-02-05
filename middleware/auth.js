const jwt = require("jsonwebtoken");

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
};

const authMiddleware = (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const roleMiddleware = (roles = []) => (req, res, next) => {
  if (!req.user || (roles.length > 0 && !roles.includes(req.user.role))) {
    return res.status(403).json({ message: "Access denied" });
  }
  return next();
};

module.exports = { authMiddleware, roleMiddleware };
