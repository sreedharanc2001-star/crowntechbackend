const Booking = require("../models/Booking");
const User = require("../models/User");
const { categorizeIssue, findKeywordCategory } = require("../services/aiCategorizer");

const SERVICE_TYPES = ["Mobile Repair", "Laptop Repair"];
const TIME_SLOTS = ["Morning (9-12)", "Afternoon (12-4)", "Evening (4-8)"];
const AI_TIMEOUT_MS = 8000;

const normalizeStatus = (status) => {
  if (!status) return "PENDING";
  const upper = status.toUpperCase();
  return upper.replace(" ", "_");
};

const withTimeout = async (promise, ms, fallbackValue) => {
  let timeoutId;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(fallbackValue), ms);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const classifyBookingInBackground = (bookingId, issueText) => {
  setImmediate(async () => {
    const aiResult = await withTimeout(
      categorizeIssue(issueText),
      AI_TIMEOUT_MS,
      {
        category: findKeywordCategory(issueText),
        confidence: null,
        source: "fallback",
        notes: "AI categorization timed out; kept keyword category.",
      }
    );

    try {
      await Booking.findByIdAndUpdate(bookingId, {
        issueCategory: aiResult.category,
        aiConfidence: aiResult.confidence,
        aiSource: aiResult.source,
        aiNotes: aiResult.notes || "",
      });
    } catch (err) {
      console.error("Failed to update AI category:", err?.message || err);
    }
  });
};

const createBooking = async (req, res) => {
  try {
    const {
      serviceType,
      deviceModel,
      issue,
      preferredDate,
      timeSlot,
      description,
    } = req.body;

    const normalizedService = (serviceType || "").trim();
    const normalizedDevice = (deviceModel || "").trim();
    const normalizedIssue = (issue || description || "").trim();
    const normalizedDate = (preferredDate || "").trim();
    const normalizedSlot = (timeSlot || "").trim();
    const fallbackPhone = (req.body.userPhone || "").trim();

    if (
      !normalizedService ||
      !normalizedDevice ||
      !normalizedIssue ||
      !normalizedDate ||
      !normalizedSlot
    ) {
      return res.status(400).json({ message: "All booking fields are required." });
    }

    if (!SERVICE_TYPES.includes(normalizedService)) {
      return res.status(400).json({ message: "Invalid service type." });
    }
    if (!TIME_SLOTS.includes(normalizedSlot)) {
      return res.status(400).json({ message: "Invalid time slot." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.email) {
      return res.status(400).json({ message: "User email is missing. Please contact support." });
    }
    const keywordCategory = findKeywordCategory(normalizedIssue);

    const booking = await Booking.create({
      userId: req.user.id,
      userName: user.name || "User",
      userEmail: user.email,
      userPhone: (user.phone || fallbackPhone || "").trim(),
      serviceType: normalizedService,
      deviceModel: normalizedDevice,
      issue: normalizedIssue,
      issueCategory: keywordCategory,
      aiConfidence: null,
      aiSource: "pending",
      aiNotes: "AI categorization queued.",
      preferredDate: normalizedDate,
      timeSlot: normalizedSlot,
      status: "PENDING",
    });

    classifyBookingInBackground(booking._id, normalizedIssue);

    return res.json({
      message: "Service booked successfully.",
      booking,
    });
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      const firstMessage = Object.values(err.errors || {})[0]?.message;
      return res.status(400).json({ message: firstMessage || "Invalid booking payload." });
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: "Booking conflict detected. Please submit again." });
    }
    return res.status(500).json({ message: "Service booking failed." });
  }
};

const trackBookings = async (req, res) => {
  const phone = (req.query.phone || "").trim();
  const email = (req.query.email || "").trim().toLowerCase();
  const bookingId = (req.query.bookingId || "").trim().toUpperCase();

  if (!phone && !email && !bookingId) {
    return res.status(400).json({ message: "Phone, email, or booking ID is required." });
  }

  const query = {};
  if (phone) query.userPhone = phone;
  if (email) query.userEmail = email;
  if (bookingId) query.bookingId = bookingId;

  const bookings = await Booking.find(query).sort({ createdAt: -1 });
  return res.json(bookings);
};

const getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
  return res.json(bookings);
};

const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ message: "Status is required." });
  }
  const nextStatus = normalizeStatus(status);
  const allowed = ["PENDING", "APPROVED", "IN_PROGRESS", "COMPLETED", "REJECTED"];
  if (!allowed.includes(nextStatus)) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  const update = { status: nextStatus };
  if (nextStatus === "COMPLETED") {
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

const updateBookingComment = async (req, res) => {
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

const submitBookingFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const parsedRating = Number(rating);
    const normalizedComment = String(comment || "").trim();

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be an integer between 1 and 5." });
    }
    if (!normalizedComment) {
      return res.status(400).json({ message: "Feedback comment is required." });
    }
    if (normalizedComment.length > 500) {
      return res.status(400).json({ message: "Feedback comment must be 500 characters or less." });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }
    if (String(booking.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only submit feedback for your own booking." });
    }

    const bookingStatus = normalizeStatus(booking.status);
    if (bookingStatus !== "COMPLETED") {
      return res.status(400).json({ message: "Feedback can be submitted only for completed services." });
    }
    if (booking.feedbackRating !== null || booking.feedbackComment) {
      return res.status(409).json({ message: "Feedback already submitted for this booking." });
    }

    booking.feedbackRating = parsedRating;
    booking.feedbackComment = normalizedComment;
    booking.feedbackCreatedAt = new Date();
    await booking.save();

    return res.json({
      message: "Thank you for your feedback.",
      booking,
    });
  } catch (err) {
    console.error("submitBookingFeedback failed:", err?.message || err);
    return res.status(500).json({ message: "Unable to submit feedback right now." });
  }
};

module.exports = {
  createBooking,
  trackBookings,
  getMyBookings,
  updateBookingStatus,
  updateBookingComment,
  submitBookingFeedback,
};



