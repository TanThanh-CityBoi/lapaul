const express = require('express')
const adminController = require("../app/controllers/AdminController");
const adminRequire = require("../app/middlewares/adminRequire");
const router = express.Router()


router.get('/', /* adminRequire ,*/ adminController.getAllUsers)
router.get('/users/:id', /* adminRequire ,*/ adminController.getUsers)
router.get('/detailUser/:id', /* adminRequire ,*/ adminController.getUser)
router.post('/detailUser/update-status', /* adminRequire ,*/ adminController.updateStatus)

module.exports = router
