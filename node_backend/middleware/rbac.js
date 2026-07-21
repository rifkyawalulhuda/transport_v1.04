const jwt = require("jsonwebtoken");

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return "";
  }
  return header.slice("Bearer ".length).trim();
};

const isAllowedForCs = (req) => {
  const method = req.method.toUpperCase();
  const path = req.path || "";
  const allowedRoutes = [
    { method: "GET", path: "/schedule-pengiriman" },
    { method: "GET", path: "/auth/me" },
    { method: "PUT", path: "/auth/me" }
  ];

  return allowedRoutes.some(
    (route) => route.method === method && (path === route.path || path.startsWith(route.path + '/'))
  );
};

const restrictCsAccess = (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    return next();
  }

  // Use req.user if already decoded by authenticateToken, otherwise decode ourselves
  let payload = req.user || null;
  if (!payload) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET belum dikonfigurasi");
      return res.status(500).json({ message: "JWT secret belum dikonfigurasi" });
    }
    try {
      payload = jwt.verify(token, secret);
    } catch (error) {
      return res.status(401).json({ message: "Token tidak valid" });
    }
  }

  if (payload?.level !== "cs") {
    return next();
  }

  if (isAllowedForCs(req)) {
    return next();
  }

  return res.status(403).json({ message: "Forbidden" });
};

const isAllowedForPatcher = (req) => {
  const method = req.method.toUpperCase();
  const path = req.path || "";
  const allowedRoutes = [
    { method: "GET", path: "/bbs" },
    { method: "POST", path: "/bbs" },
    { method: "PUT", path: "/bbs" },
    { method: "DELETE", path: "/bbs" },
    { method: "GET", path: "/trucks" },
    { method: "GET", path: "/drivers" },
    { method: "GET", path: "/auth/me" },
    { method: "PUT", path: "/auth/me" }
  ];

  return allowedRoutes.some(
    (route) => route.method === method && (path === route.path || path.startsWith(route.path + '/'))
  );
};

const restrictPatcherAccess = (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    return next();
  }

  // Use req.user if already decoded by authenticateToken, otherwise decode ourselves
  let payload = req.user || null;
  if (!payload) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET belum dikonfigurasi");
      return res.status(500).json({ message: "JWT secret belum dikonfigurasi" });
    }
    try {
      payload = jwt.verify(token, secret);
    } catch (error) {
      return res.status(401).json({ message: "Token tidak valid" });
    }
  }

  if (payload?.level !== "patcher") {
    return next();
  }

  if (isAllowedForPatcher(req)) {
    return next();
  }

  return res.status(403).json({ message: "Forbidden" });
};

module.exports = {
  restrictCsAccess,
  restrictPatcherAccess
};
