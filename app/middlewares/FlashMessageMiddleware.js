module.exports = function FlashMessageMiddleware(req, res, next) {
  req.app.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
};
