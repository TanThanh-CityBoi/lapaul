const express = require("express");
const activityController = require("../app/controllers/ActivityController");
const router = express.Router();

router.get("/", activityController.show_index);
router.get("/payment", activityController.show_payment);
router.get("/cashout", activityController.show_cashout);
router.get("/transmoney", activityController.show_transmoney);
router.get("/buying", activityController.show_buying);

router.post("/payment", activityController.payment)
router.post("/cashout", activityController.cashout)
router.post("/transmoney", activityController.transmoney)
router.post("/transmoney", activityController.transmoney)
router.post("/transmoney", activityController.transmoney)


router.get('/transaction',  activityController.getTransactions)
router.get('/transaction/detail/:id',  activityController.getTransaction)
router.post('/transaction/update-status',  activityController.updateTransaction)
router.post('/createTransaction', activityController.createTransaction)

module.exports = router;
