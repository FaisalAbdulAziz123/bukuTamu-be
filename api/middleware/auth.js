// middleware/auth.js

// Middleware untuk cek apakah user sudah login (user biasa)
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: "Anda harus login terlebih dahulu" });
}

// Middleware untuk cek apakah admin sudah login
function isAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  return res.status(403).json({ error: "Akses ditolak, hanya admin yang bisa masuk" });
}

module.exports = { isAuthenticated, isAdmin };
