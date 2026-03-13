const { getUser } = require("../service/auth");

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = req.cookies?.token || (authHeader && authHeader.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = getUser(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // ATTACH USER
  req.user = user;

  next();
}

module.exports = { authMiddleware };
