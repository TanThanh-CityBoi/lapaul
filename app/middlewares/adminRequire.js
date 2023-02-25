module.exports = function loggedInRequire(req, res, next) {
    if (!req.session.user) {
      return res.redirect("/login");
    }
  
    if (!req.session.user.isadmin === 0) {
      return res.redirect("/404");
    }
    return next();
  };
  