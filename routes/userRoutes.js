const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { getUserBookings, createBooking } = require("../controllers/userController");

const router = express.Router();

router.get("/bookings", authMiddleware, roleMiddleware(["user"]), getUserBookings);
router.post("/booking", authMiddleware, roleMiddleware(["user"]), createBooking);

module.exports = router;
