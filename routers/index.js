const accountRouter = require("./account");
const activityRouter = require("./activity");
const adminRouter = require("./admin");
const loggedInRequire = require("../app/middlewares/loggedInRequire");

function router(app) {
  app.use("/", accountRouter);

  app.use("/index", loggedInRequire, activityRouter);

  app.use("/admin", adminRouter);

  app.use((req, res) => {
    res.redirect("/error");
  });

  app.use((err, req, res, next) => {
    console.log(err.message);
    res.status(500);
    res.render("500");
  });
}

module.exports = router;
