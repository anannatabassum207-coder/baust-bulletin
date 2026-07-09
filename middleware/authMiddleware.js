function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  return res.redirect("/");
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.Role === "Admin") return next();
  return res.send("Access denied. Admin only.");
}

module.exports = { isLoggedIn, isAdmin };