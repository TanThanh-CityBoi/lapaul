const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
const handlebars = require("express-handlebars");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const credentail = require("./credential");
const methodOverride = require("method-override");
const flashMessageMidldeware = require("./app/middlewares/FlashMessageMiddleware");
const route = require("./routers");
const app = express();
const port = 8080;

// Set static path

// Set method POST, PUT, DELETE, GET
// app.use(methodOverride("_method"));

// Set view engine
app.engine(
  "hbs",
  handlebars.engine({
    extname: ".hbs",
    helpers: {},
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "resources", "views"));

// register handlebars function
var hbs = handlebars.create({});
hbs.handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

  switch (operator) {
      case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
          return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||':
          return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default:
          return options.inverse(this);
  }
});

// Set middleware read resquest-body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set middleware rate-limit (limit access of one window in times)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// app.use(limiter)

// Set cookie and session
app.use(cookieParser(credentail.cookieSecret, { maxAge: null }));
app.use(session({ cookie: { maxAge: 600000 } }));

// Set Flash middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(flashMessageMidldeware);

// Set route
route(app);

app.listen(port, function () {
  console.log(`Server listen at: http://localhost:${port}`);
});

module.exports = app;
