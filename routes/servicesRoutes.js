const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  createBooking,
  trackBookings,
  getMyBookings,
  updateBookingStatus,
  updateBookingComment,
} = require("../controllers/servicesController");

const router = express.Router();

router.get("/track", trackBookings);
router.get("/my", authMiddleware, roleMiddleware(["user"]), getMyBookings);
router.post(
  "/book",
  authMiddleware,
  roleMiddleware(["user"]),
  upload.array("images", 5),
  createBooking
);

router.put(
  "/booking/:id/status",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateBookingStatus
);
router.put(
  "/booking/:id/comment",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateBookingComment
);

module.exports = router;
