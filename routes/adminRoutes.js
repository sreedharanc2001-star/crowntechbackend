const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const {
  getAllBookings,
  updateStatus,
  updateComment,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/bookings", authMiddleware, roleMiddleware(["admin"]), getAllBookings);
router.put(
  "/booking/:id/status",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateStatus
);
router.put(
  "/booking/:id/comment",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateComment
);

module.exports = router;
