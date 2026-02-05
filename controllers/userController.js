const Booking = require("../models/Booking");

const getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });
  return res.json(bookings);
};

const createBooking = async (req, res) => {
  const { device, issue } = req.body;
  if (!device || !issue) {
    return res.status(400).json({ message: "Device and issue are required" });
  }

  const booking = await Booking.create({
    userId: req.user.id,
    device,
    issue,
  });
  return res.json({ message: "Booking created successfully", booking });
};

module.exports = { getUserBookings, createBooking };
