const jwt = require("jsonwebtoken");

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return "";
  }
  return header.slice("Bearer ".length).trim();
};

const authenticateToken = (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: "Token tidak ditemukan" });
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET belum dikonfigurasi");
    return res.status(500).json({ message: "JWT secret belum dikonfigurasi" });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token tidak valid" });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.level !== "admin") {
    return res.status(403).json({ message: "Akses ditolak" });
  }
  return next();
};

module.exports = {
  authenticateToken,
  requireAdmin
};
