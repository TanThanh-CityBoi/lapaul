class AccountController {
  // [GET] /
  show(req, res) {
    return res.render("home");
  }

  login(req, res) {
    return res.render("account/login", { flash: req.app.locals.flash });
  }

  register(req, res) {
    res.render("account/register");
  }

  repassword(req, res) {
    res.render("account/repassword");
  }

  forgetpassword(req, res) {
    res.render("account/forgetpassword.hbs");
  }

  changePassword(req, res) {
    res.render("account/change_password");
  }

  updatePhoto(req, res) {
    res.render("account/update_photo");
  }

  // [GET] /error
  error(req, res) {
    res.render("404");
  }
}

module.exports = new AccountController();
