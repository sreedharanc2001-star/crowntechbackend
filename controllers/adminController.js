const Booking = require("../models/Booking");

const getAllBookings = async (_req, res) => {
  const bookings = await Booking.find().sort({ createdAt: -1 });
  return res.json(bookings);
};

const updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  const normalized = status.toUpperCase().replace(" ", "_");
  const allowedStatus = ["PENDING", "APPROVED", "IN_PROGRESS", "COMPLETED", "REJECTED"];

  if (!allowedStatus.includes(normalized)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  const update = { status: normalized };
  if (normalized === "COMPLETED") {
    update.completionMessage =
      "Your repair service is completed. Please collect your device.";
  }

  const booking = await Booking.findByIdAndUpdate(req.params.id, update, {
    new: true,
  });

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  return res.json(booking);
};

const updateComment = async (req, res) => {
  const { comment } = req.body;
  if (typeof comment !== "string") {
    return res.status(400).json({ message: "Comment is required" });
  }

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { adminComments: comment, comment },
    { new: true }
  );
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  return res.json(booking);
};

module.exports = { getAllBookings, updateStatus, updateComment };
