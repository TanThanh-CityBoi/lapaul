module.exports = function redirectIfLogged(req, res, next) {
  if (req.session.user) {
    if (
      (req.path === "/repassword" && req.session.user.password_changed === 0) ||
      req.session.user.forget_password === true
    ) {
      return next();
    }

    return res.redirect("/index");
  }
  return next();
};
