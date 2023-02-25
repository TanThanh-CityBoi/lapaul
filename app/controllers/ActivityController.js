const res = require("express/lib/response");
const SqlString = require("mysql/lib/protocol/SqlString");
const query = require("../../database/mysql");
const transporter = require("../../email/transporter");

class ActivityController {
  show_index(req, res) {
    res.render("index", {
      title: "index_header",
      user: req.session.user,
    });
  }

  show_payment(req, res) {
    res.render("activity/payment");
  }

  show_cashout(req, res) {
    res.render("activity/cashout");
  }

  show_transmoney(req, res) {
    res.render("activity/transmoney");
  }

  show_buying(req, res) {
    res.render("activity/buying");
  }

  async payment(req, res) {
    const credit_card_number = req.body.credit_card_number;
    const month = req.body.month;
    const year = req.body.year;
    const security_code = req.body.security_code;
    const balance = req.body.payment_money;
    const credict_card = await query(
      "SELECT * FROM `credit_card` WHERE `card_number` = ?",
      [credit_card_number]
    );

    if (credict_card.length > 0) {
      if (security_code !== credict_card[0].cvv) {
        return res.render("activity/payment", {
          formdata: req.body,
          error: { msg: "Mã CVV không chính xác." },
        });
      }
      if (month !== credict_card[0].expire_mm || year !== credict_card[0].expire_yy) {
        return res.render("activity/payment", {
          formdata: req.body,
          error: { msg: "Ngày hết hạn không chính xác." },
        });
      } else {
        switch (credict_card[0].card_number) {
          case '333333':
            return res.render("activity/payment", {
              formdata: req.body,
              error: { msg: "Thẻ hết tiền, vui lòng thử lại với mã thẻ khác." },
            });
            break;
          case '222222':
            if (balance > 1000000) {
              return res.render("activity/payment", {
                formdata: req.body,
                error: { msg: "Thẻ chỉ hỗ trợ tối đa 1.000.000đ mỗi lần rút." },
              });
            }
            break;
        }
        const payment = await query(
          "UPDATE `user` SET `balance`= `balance` + ? WHERE `id` = ?",
          [balance, req.session.user.id]
        );
        req.session.user.balance = req.session.user.balance + balance;
        flash = {
          type: "success",
          message: "Chuyển số tiền " + balance + " vào tài khoản thành công.",
        };
        req.session.flash = flash;
        return res.redirect("/index/payment");
      }
    }
    return res.render("activity/payment", {
      formdata: req.body,
      error: { msg: "Thẻ này không được hỗ trợ." },
    });

  }

  async cashout(req, res) {
    const credit_card_number = req.body.credit_card_number;
    const month = req.body.month;
    const year = req.body.year;
    const security_code = req.body.security_code;
    const balance = req.body.payment_money;
    const detail = req.body.payment_detail;
    const credict_card = await query(
      "SELECT * FROM `credit_card` WHERE `card_number` = ?",
      [credit_card_number]
    );
    if (credict_card.length > 0) {
      if (security_code !== credict_card[0].cvv) {
        return res.render("activity/cashout", {
          formdata: req.body,
          error: { msg: "Mã CVV không chính xác." },
        });
      }
      if (month !== credict_card[0].expire_mm || year !== credict_card[0].expire_yy) {
        return res.render("activity/cashout", {
          formdata: req.body,
          error: { msg: "Ngày hết hạn không chính xác." },
        });
      }
      if (credict_card[0].card_number === '111111') {
        if (req.session.user.balance < balance * (1.05)) {
          return res.render("activity/cashout", {
            formdata: req.body,
            error: { msg: "Số dư tài khoản không đủ, vui lòng thử lại." },
          });
        }
        const payment = await query(
          "UPDATE `user` SET `balance`= `balance` - ? WHERE `id` = ?",
          [balance * (1.05), req.session.user.id]
        );
        req.session.user.balance = req.session.user.balance - balance * (1.05);
        flash = {
          type: "success",
          message: "Chuyển số tiền " + balance + " vào tài khoản thành công.",
        };
        req.session.flash = flash;
        return res.redirect("/index/cashout");
      }
      return res.render("activity/cashout", {
        formdata: req.body,
        error: { msg: "Thẻ này không được hỗ trợ." },
      });
    }
    return res.render("activity/cashout", {
      formdata: req.body,
      error: { msg: "Thông tin thẻ không hợp lệ." },
    });
  }

  async transmoney(req, res) {
    const credit_card_number = req.body.credit_card_number;
    var balance = req.body.payment_money;
    var balance_sent = req.body.payment_money;
    const detail = req.body.payment_detail;
    const credict_card = await query(
      "SELECT * FROM `user` WHERE `phone` = ?",
      [credit_card_number]
    );
    if (credict_card.length > 0) {
      if (credict_card[0].id == req.session.user.id) {
        return res.render("activity/transmoney", {
          formdata: req.body,
          error: { msg: "Bạn không thể chuyển khoản cho chính mình." },
        });
      }
      const otp = Math.floor(Math.random() * 1000000);
      const sqlOtp = `INSERT INTO otp (user_id, otp, expired_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 MINUTE))`;
      const paramsOtp = [req.session.user.id, otp];
      const resultOtp = await query(sqlOtp, paramsOtp);
      const mailOptions = {
        from: "lapaul.system@gmail.com",
        to: req.session.user.email,
        subject: "Your Lapaul Transfer Money OTP",
        text: "Your OTP is " + otp,
      };
      switch (req.body.btn_submit) {
        case 'Chuyển tiền':
          if (req.body.fee == 'sender') {
            if (req.session.user.balance < balance * (1.05)) {
              return res.render("activity/transmoney", {
                formdata: req.body,
                error: { msg: "Số dư tài khoản không đủ, bao gồm chi phí chuyển khoản." },
              });
            }
            balance = balance * (1.05)
          }
          else {
            if (req.session.user.balance < balance) {
              return res.render("activity/transmoney", {
                formdata: req.body,
                error: { msg: "Số dư tài khoản không đủ, không bao gồm chi phí chuyển khoản." },
              });
            }
            balance_sent = balance_sent * (0.95)
          }
          const otp_old = req.body.otp.trim();
          const sql = `SELECT * FROM otp WHERE user_id = (SELECT id FROM user WHERE email = ?) AND otp = ? AND expired_at > NOW() AND verified = 0`;
          const params = [req.session.user.email, otp_old];
          const result = await query(sql, params);
          if (result.length === 0) {
            return res.render("activity/transmoney", {
              formdata: req.body,
              transform: { name: credict_card[0].fullname },
              error: { msg: "OTP không đúng hoặc đã hết hạn" },
            });
          }
          const payment = await query(
            "UPDATE `user` SET `balance`= `balance` - ? WHERE `id` = ?",
            [balance, req.session.user.id]
          );
          const sentmoney = await query(
            "UPDATE `user` SET `balance`= `balance` + ? WHERE `phone` = ?",
            [balance_sent, credit_card_number]
          );
          req.session.user.balance = req.session.user.balance - balance;
          flash = {
            type: "success",
            message: "Chuyển khoản thành công thành công đến " + credict_card[0].fullname,
          };
          req.session.flash = flash;
          return res.redirect("/index/cashout");

          break;
        case 'Gửi mã OTP':
          if (resultOtp.affectedRows === 1) {
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                return res.render("activity/transmoney", {
                  formdata: req.body,
                  error: { msg: "Không thể gửi OTP, vui lòng thử lại." },
                });
              }
            });
          }
          return res.render("activity/transmoney", {
            formdata: req.body,
            transform: { name: credict_card[0].fullname },
          });
          break;
        case 'Gửi lại mã':
          if (resultOtp.affectedRows === 1) {
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                return res.render("activity/transmoney", {
                  formdata: req.body,
                  error: { msg: "Không thể gửi OTP, vui lòng thử lại." },
                });
              }
            });
          }
          return res.render("activity/transmoney", {
            formdata: req.body,
            transform: { name: credict_card[0].fullname },
          });
          break;
      }
    }
    return res.render("activity/transmoney", {
      formdata: req.body,
      error: { msg: "Không tồn tại người nhận có số điện thoại này." },
    });
  }

//-------------------------transaction---------------------------------------//

  async getTransactions(req, res) {
    const userID = req.session.user.id;
    const transaction_Sql = "select *, DATE_FORMAT(created_at, '%d-%m-%Y') as created_date from transaction WHERE creator_id= " + userID + " ORDER BY created_at DESC"
    const transactions = await query(transaction_Sql);
    res.render('transaction', { transactions: transactions, })
  }

  async getTransaction(req, res) {

    const transactionID = req.params.id;
    const transaction_Sql = `select transaction.id, transaction.type, transaction.status, transaction.total, transaction.note, transaction.created_at,`
      + `user2.fullname as username2, `
      + `DATE_FORMAT(transaction.created_at, '%d-%m-%Y') as created_date from transaction `
      + `left join user as user2 ON transaction.receiver_id = user2.id `
      + `WHERE transaction.id=` + transactionID
    const transaction = await query(transaction_Sql);
    //console.log("result data: ", transaction);
    res.render('detailTransaction', { transaction: transaction[0] })
  }

  async updateTransaction(req, res) {

    const { status, id } = req.body;
    var SqlString = "UPDATE transaction SET status = \'" + status + "\' WHERE id = " + id;
    // console.log("sql: ", SqlString);
    const result = await query(SqlString);
    res.status(200).json({ data: result, status: "success" });
  }

  async createTransaction(req, res) {
    const creator_id = req.body.creator_id;
    const receiver_id = req.body.receiver_id;
    const type = req.body.type;
    const status = req.body.status;
    const total = req.body.total;
    const note = req.body.note;
    const params = [
      creator_id,
      receiver_id,
      type,
      status,
      total,
      note
    ];
    const sql = "INSERT INTO transaction (creator_id, receiver_id, type, status, total, note) VALUES (?, ?, ?, ?, ?, ?)"
    const result = await query(sql, params);
    res.status(200).send(
      JSON.stringify({
        result: result
      })
    )
    // console.log("result: ", result);
  }

}

module.exports = new ActivityController();
