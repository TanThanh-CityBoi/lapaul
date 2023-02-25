module.exports = function loggedInRequire(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  if (!req.session.user.password_changed === 0) {
    return res.redirect("/repassword");
  }
  return next();
};
