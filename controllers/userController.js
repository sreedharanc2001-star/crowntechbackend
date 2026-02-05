const Booking = require("../models/Booking");
const User = require("../models/User");

const getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });
  return res.json(bookings);
};

const createBooking = async (req, res) => {
  const {
    device,
    issue,
    serviceType,
    deviceModel,
    preferredDate,
    timeSlot,
    description,
  } = req.body;

  const normalizedIssue = (issue || description || "").trim();
  const normalizedDevice = (deviceModel || device || "").trim();
  const normalizedService = (serviceType || "Mobile Repair").trim();
  const normalizedDate = (preferredDate || "").trim();
  const normalizedSlot = (timeSlot || "").trim();

  if (!normalizedDevice || !normalizedIssue) {
    return res.status(400).json({ message: "Device and issue are required" });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const booking = await Booking.create({
    userId: req.user.id,
    userName: user.name || "User",
    userEmail: user.email,
    userPhone: user.phone || "",
    serviceType: normalizedService,
    deviceModel: normalizedDevice,
    issue: normalizedIssue,
    preferredDate: normalizedDate || "N/A",
    timeSlot: normalizedSlot || "N/A",
    status: "PENDING",
  });
  return res.json({ message: "Booking created successfully", booking });
};

module.exports = { getUserBookings, createBooking };
