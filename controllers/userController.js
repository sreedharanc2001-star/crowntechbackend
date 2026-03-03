const Booking = require("../models/Booking");
const User = require("../models/User");
const { categorizeIssue, findKeywordCategory } = require("../services/aiCategorizer");

const AI_TIMEOUT_MS = 8000;

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

  const keywordCategory = findKeywordCategory(normalizedIssue);

  const booking = await Booking.create({
    userId: req.user.id,
    userName: user.name || "User",
    userEmail: user.email,
    userPhone: user.phone || "",
    serviceType: normalizedService,
    deviceModel: normalizedDevice,
    issue: normalizedIssue,
    issueCategory: keywordCategory,
    aiConfidence: null,
    aiSource: "pending",
    aiNotes: "AI categorization queued.",
    preferredDate: normalizedDate || "N/A",
    timeSlot: normalizedSlot || "N/A",
    status: "PENDING",
  });

  classifyBookingInBackground(booking._id, normalizedIssue);

  return res.json({ message: "Booking created successfully", booking });
};

module.exports = { getUserBookings, createBooking };
