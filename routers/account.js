const express = require("express");
const accountController = require("../app/controllers/AccountController");
const router = express.Router();
const multer = require("multer");
const query = require("../database/mysql");
const path = require("path");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const redirectIfLogged = require("../app/middlewares/redirectIfLogged");
const loggedInRequire = require("../app/middlewares/loggedInRequire");
const crypto = require("crypto");

const transporter = require("../email/transporter");

const upload = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname));
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: File is not an image");
  },
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../public/uploads"));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + file.originalname);
    },
  }),
});

router.get("/", accountController.show);
router.get("/login", redirectIfLogged, accountController.login);
router.get("/register", redirectIfLogged, accountController.register);
router.get("/error", accountController.error);
router.get(
  "/repassword",
  redirectIfLogged,
  loggedInRequire,
  accountController.repassword
);
router.get(
  "/forgetpassword",
  redirectIfLogged,
  accountController.forgetpassword
);
router.get(
  "/change-password",
  loggedInRequire,
  accountController.changePassword
);

router.get("/update-photo", loggedInRequire, accountController.updatePhoto);

const cpUpload = upload.fields([
  { name: "front-nid", maxCount: 1 },
  { name: "back-nid", maxCount: 1 },
]);
router.post(
  "/register",

  cpUpload,

  check("email")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .custom(async (value) => {
      const user = await query("SELECT * FROM user WHERE email = ?", [value]);
      if (user.length > 0) {
        return Promise.reject("Email đã tồn tại");
      }
    }),

  check("phone")
    .isLength({ min: 10, max: 10 })
    .withMessage("Số điện thoại không hợp lệ")
    .isNumeric()
    .withMessage("Số điện thoại không hợp lệ")
    .custom(async (value) => {
      const user = await query("SELECT * FROM user WHERE phone = ?", [value]);
      if (user.length > 0) {
        return Promise.reject("Số điện thoại đã tồn tại");
      }
    }),
  check("fullname").isLength({ min: 1 }).withMessage("Vui lòng nhập họ tên"),
  check("birthday")
    .isLength({ min: 1 })
    .withMessage("Vui lòng nhập ngày sinh")
    .isDate()
    .withMessage("Birthday must be a date"),
  check("address").isLength({ min: 1 }).withMessage("Vui lòng nhập địa chỉ"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("account/register", {
        formdata: req.body,
        error: errors.array()[0],
      });
    }

    const fullname = req.body.fullname.trim();
    const email = req.body.email.trim();
    const phone = req.body.phone.trim();
    const address = req.body.address.trim();
    const birthday = req.body.birthday.trim();

    let nid_front_photourl = "";
    let nid_back_photourl = "";

    try {
      nid_front_photourl = "uploads/" + req.files["front-nid"][0].filename;
      nid_back_photourl = "uploads/" + req.files["back-nid"][0].filename;
    } catch (error) {
      return res.render("account/register", {
        formdata: req.body,
        error: { msg: "Vui lòng tải hình ảnh 2 mặt CMND" },
      });
    }

    // const username = Math.random().toString(36).substring(2, 12);
    // const password = Math.random().toString(36).substring(2, 8);

    // development mode
    const username = phone;
    const password = "123456";

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const sql = `INSERT INTO user (username, password, fullname, email, phone, address, birthday, nid_front_photourl, nid_back_photourl, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      username,
      hash,
      fullname,
      email,
      phone,
      address,
      birthday,
      nid_front_photourl,
      nid_back_photourl,
      "inactive", // password must be changed after login
    ];
    const result = await query(sql, params);
    if (result.affectedRows === 1) {
      const mailOptions = {
        from: "lapaul.system@gmail.com",
        to: email,
        subject: "Welcome to Lapaul",
        text:
          "Your account has been created:" +
          "\n" +
          "Username: " +
          username +
          "\n" +
          "Password: " +
          password,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log(info);
        }
      });

      req.session.flash = {
        type: "success",
        message: "Đăng ký thành công",
      };
      return res.redirect("/login");
    } else {
      return res.render("account/register", {
        formdata: req.body,
        error: { msg: "Đăng ký thất bại" },
      });
    }
  }
);

router.post(
  "/update-photo",

  cpUpload,

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("account/update_photo", {
        formdata: req.body,
        error: errors.array()[0],
      });
    }

    let nid_front_photourl = "";
    let nid_back_photourl = "";

    try {
      nid_front_photourl = "uploads/" + req.files["front-nid"][0].filename;
      nid_back_photourl = "uploads/" + req.files["back-nid"][0].filename;
    } catch (error) {
      return res.render("account/update_photo", {
        formdata: req.body,
        error: { msg: "Vui lòng tải hình ảnh 2 mặt CMND" },
      });
    }

    const sql = `UPDATE user SET nid_front_photourl = ?, nid_back_photourl = ? WHERE id = ?`;
    const params = [nid_front_photourl, nid_back_photourl, req.session.user.id];
    const result = await query(sql, params);

    if (result.affectedRows === 1) {
      req.session.flash = {
        type: "success",
        message: "Cập nhật thành công",
      };
      req.session.user.nid_front_photourl = nid_front_photourl;
      req.session.user.nid_back_photourl = nid_back_photourl;

      return res.redirect("/index");
    }

    return res.render("account/update_photo", {
      formdata: req.body,
      error: { msg: "Cập nhật thất bại" },
    });
  }
);

router.post(
  "/login",

  check("username")
    .isLength({ max: 10, min: 10 })
    .withMessage("Số điện thoại không hợp lệ"),
  check("password")
    .isLength({ max: 6, min: 6 })
    .withMessage("Mật khẩu không hợp lệ"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("account/login", {
        formdata: req.body,
        error: errors.array()[0],
      });
    }
    const username = req.body.username.trim();
    const password = req.body.password.trim();
    const user = await query(
      "SELECT *, unix_timestamp(temporary_lock_time) as unix_timestamp FROM user WHERE username = ?",
      [username]
    );
    if (user.length > 0) {
      const offSet =
        user[0]["unix_timestamp"] - ((new Date().getTime() / 1000) | 0);
      if (offSet > 0) {
        flash = {
          type: "danger",
          message: `Tài khoản hiện đang bị tạm khóa, vui lòng thử lại sau ${offSet} giây`,
        };

        return res.render("account/login", {
          formdata: req.body,
          flash: flash,
        });
      }

      if (user[0].status === "locked") {
        flash = {
          type: "danger",
          message:
            "Tài khoản đã bị khóa do nhập sai mật khẩu nhiều lần, vui lòng liên hệ quản trị viên để được hỗ trợ",
        };
        return res.render("account/login", {
          formdata: req.body,
          flash: flash,
        });
      }

      const isMatch = await bcrypt.compare(password, user[0].password);

      if (isMatch) {
        await query(
          "UPDATE user SET wrong_password_attempt = 0, suspicious_login = 0 WHERE username = ?",
          [username]
        );

        req.session.user = user[0];

        if (user[0]["password_changed"] === 0) {
          return res.redirect("/repassword");
        }

        if (user[0]["password_changed"] === 1) {
          flash = {
            type: "success",
            message: "Đăng nhập thành công",
          };

          req.session.flash = flash;

          return res.redirect("/index");
        }
      }

      if (!isMatch) {
        const sql = `UPDATE user SET wrong_password_attempt = wrong_password_attempt + 1 WHERE username = ?`;
        const params = [username];
        const result = await query(sql, params);

        const updatedUser = await query(
          "SELECT * FROM user WHERE username = ?",
          [username]
        );

        req.session.user = updatedUser[0];

        if (updatedUser[0]["wrong_password_attempt"] >= 3) {
          if (updatedUser[0]["suspicious_login"] === 0) {
            const sql = `UPDATE user SET temporary_lock_time = NOW() + INTERVAL 1 MINUTE, suspicious_login = 1, wrong_password_attempt = 0 WHERE username = ?`;
            const params = [username];
            const result = await query(sql, params);
            flash = {
              type: "danger",
              message:
                "Tài khoản hiện đang bị tạm khóa, vui lòng thử lại sau 1 phút",
            };

            return res.render("account/login", {
              formdata: req.body,
              flash: flash,
            });
          }

          if (updatedUser[0]["suspicious_login"] === 1) {
            const sql = `UPDATE user SET status = 'locked' WHERE username = ?`;
            const params = [username];
            const result = await query(sql, params);
            flash = {
              type: "danger",
              message:
                "Tài khoản đã bị khóa do nhập sai mật khẩu nhiều lần, vui lòng liên hệ quản trị viên để được hỗ trợ",
            };
            return res.render("account/login", {
              formdata: req.body,
              flash: flash,
            });
          }
        }
      }
    }

    return res.render("account/login", {
      formdata: req.body,
      error: { msg: "Tài khoản hoặc mật khẩu không đúng" },
    });
  }
);

router.post(
  "/repassword",
  check("password")
    .isLength({ max: 6, min: 6 })
    .withMessage("Mật khẩu không hợp lệ"),
  check("re-password")
    .isLength({ max: 6, min: 6 })
    .withMessage("Mật khẩu không hợp lệ"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("account/repassword", {
        formdata: req.body,
        error: errors.array()[0],
      });
    }
    const password = req.body.password.trim();
    const re_password = req.body["re-password"].trim();
    if (password !== re_password) {
      return res.render("account/repassword", {
        formdata: req.body,
        error: { msg: "Mật khẩu không trùng nhau" },
      });
    }
    const user = req.session.user;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const sql = `UPDATE user SET password = ?, password_changed = 1 WHERE id = ?`;
    const params = [hash, user.id];
    const result = await query(sql, params);
    if (result.affectedRows === 1) {
      req.session.user.password_changed = 1;
      return res.redirect("/index");
    }
    return res.render("account/repassword", {
      formdata: req.body,
      error: { msg: "Cập nhật mật khẩu thất bại" },
    });
  }
);

router.post(
  "/change-password",
  check("old_password")
    .isLength({ max: 6, min: 6 })
    .withMessage("Mật khẩu cũ không hợp lệ"),
  check("password")
    .isLength({ max: 6, min: 6 })
    .withMessage("Mật khẩu mới không hợp lệ"),
  check("re-password")
    .isLength({ max: 6, min: 6 })
    .withMessage("Xác nhận mật khẩu không hợp lệ"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("account/change_password", {
        formdata: req.body,
        error: errors.array()[0],
      });
    }
    const password = req.body.password.trim();
    const re_password = req.body["re-password"].trim();
    if (password !== re_password) {
      return res.render("account/change_password", {
        formdata: req.body,
        error: { msg: "Mật khẩu không trùng nhau" },
      });
    }
    const old_password = req.body.old_password.trim();
    const user = req.session.user;
    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) {
      return res.render("account/change_password", {
        formdata: req.body,
        error: { msg: "Mật khẩu cũ không đúng" },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const sql = `UPDATE user SET password = ? WHERE id = ?`;
    const params = [hash, user.id];
    const result = await query(sql, params);
    if (result.affectedRows === 1) {
      req.session.user.password_changed = 1;
      req.session.user.password = hash;

      flash = {
        type: "success",
        message: "Đổi mật khẩu thành công",
      };

      req.session.flash = flash;
      return res.redirect("/index");
    }
    return res.render("account/change_password", {
      formdata: req.body,
      error: { msg: "Đổi mật khẩu thất bại" },
    });
  }
);

router.post("/forgot-password-step-1", async (req, res) => {
  const email = req.body.email.trim();
  const sql = `SELECT * FROM user WHERE email = ?`;
  const params = [email];
  const result = await query(sql, params);
  if (result.length === 0) {
    req.session.flash = flash;
    return res.render("account/forgetpassword", {
      formdata: req.body,
      error: { msg: "Email không tồn tại" },
    });
  }
  const user = result[0];
  const otp = Math.floor(Math.random() * 1000000);
  const sqlOtp = `INSERT INTO otp (user_id, otp, expired_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 MINUTE))`;

  const paramsOtp = [user.id, otp];
  const resultOtp = await query(sqlOtp, paramsOtp);
  if (resultOtp.affectedRows === 1) {
    const mailOptions = {
      from: "lapaul.system@gmail.com",
      to: email,
      subject: "Welcome to Lapaul",
      text: "Your OTP is " + otp,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.render("account/forgetpassword", {
          formdata: req.body,
          error: { msg: "Không thể gửi OTP" },
        });
      } else {
        console.log("Email sent: " + info.response);
        return res.render("account/forget_password_step_2", {
          email: user.email,
        });
      }
    });
  }
});

router.post("/forgot-password-step-2", async (req, res) => {
  const email = req.body.email.trim();
  const otp = req.body.otp.trim();
  const sql = `SELECT * FROM otp WHERE user_id = (SELECT id FROM user WHERE email = ?) AND otp = ? AND expired_at > NOW() AND verified = 0`;
  const params = [email, otp];
  const result = await query(sql, params);
  if (result.length === 0) {
    return res.render("account/forget_password_step_2", {
      formdata: req.body,
      error: { msg: "OTP không đúng hoặc đã hết hạn" },
    });
  }

  const sqlUser = `SELECT * FROM user WHERE email = ?`;
  const paramsUser = [email];
  const resultUser = await query(sqlUser, paramsUser);
  if (resultUser.length === 0) {
    return res.redirect("/forgetpassword");
  }
  req.session.user = { ...resultUser[0], forget_password: true };

  return res.redirect("/repassword");
});

module.exports = router;
