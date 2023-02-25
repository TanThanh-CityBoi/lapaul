const { sanitize } = require("express-validator");
const { json } = require("express/lib/response");
const res = require("express/lib/response");
const SqlString = require("mysql/lib/protocol/SqlString");
const query = require("../../database/mysql");


class AdminController {
    async getAllUsers(req, res) {

        const sql = "select *, DATE_FORMAT(created_at, '%d-%m-%Y') as created_date from user ORDER BY created_at DESC"
        const result = await query(sql);
       // console.log("result query: ", result);
        res.render('admin', { users: result })
    }

    async getUsers(req, res) {

        const typeUser = req.params.id;
        //console.log("id: ", typeUser);

        var SqlString = "select *, DATE_FORMAT(created_at, '%d-%m-%Y') as created_date from user where status = "
        switch (typeUser) {
            case "2": SqlString += "\'inactive\' or status = \'waiting\'";
                break;
            case "3": SqlString += "\'activated\'";
                break;
            case "4": SqlString += "\'disabled\'";
                break;
            case "5": SqlString += "\'locked\'";
                break;
            default: break;
        }
        //console.log(SqlString);///////
        SqlString += "ORDER BY created_at DESC"
        const result = await query(SqlString);
        //console.log(result);///////
        res.status(200).json({ Users: result });
    }

    async getUser(req, res) {
        const userID = req.params.id;
        var SqlString = "select * from user where id = " + userID;
        const result = await query(SqlString);
       // console.log("userID: ", userID);
        //console.log("user: ", result);
        res.render('detailUser', { user: result[0] })
    }

    async updateStatus(req, res) {

        const status = req.body.status;
        const id = req.body.userID;
       // console.log(status, id);
        var SqlString = "UPDATE user SET status = \'" + status + "\' WHERE id = " + id;
      //  console.log("sql: ", SqlString);
        const result = await query(SqlString);
       // console.log("update result: ", result);

        res.status(200).json({ data: result, status: "success" });
    }

}

module.exports = new AdminController()
