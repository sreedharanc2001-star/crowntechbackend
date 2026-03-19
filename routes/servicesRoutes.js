const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const {
  createBooking,
  trackBookings,
  getMyBookings,
  updateBookingStatus,
  updateBookingComment,
  submitBookingFeedback,
  rebookService,
} = require("../controllers/servicesController");

const router = express.Router();

router.get("/track", trackBookings);
router.get("/my", authMiddleware, roleMiddleware(["user"]), getMyBookings);
router.post(
  "/book",
  authMiddleware,
  roleMiddleware(["user"]),
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
router.post(
  "/booking/:id/feedback",
  authMiddleware,
  roleMiddleware(["user"]),
  submitBookingFeedback
);
router.post(
  "/booking/:id/rebook",
  authMiddleware,
  roleMiddleware(["user"]),
  rebookService
);

module.exports = router;
