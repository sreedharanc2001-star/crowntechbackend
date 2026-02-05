const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookingId: { type: String, unique: true, index: true },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    userPhone: { type: String, required: true, trim: true },
    serviceType: { type: String, required: true, trim: true },
    deviceModel: { type: String, required: true, trim: true },
    issue: { type: String, required: true, trim: true },
    preferredDate: { type: String, required: true, trim: true },
    timeSlot: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "IN_PROGRESS",
        "COMPLETED",
        "REJECTED",
        "pending",
        "approved",
        "in-progress",
        "completed",
        "rejected",
      ],
      default: "PENDING",
    },
    adminComments: { type: String, trim: true, default: "" },
    comment: { type: String, trim: true, default: "" },
    completionMessage: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

bookingSchema.pre("save", function onSave(next) {
  if (!this.bookingId) {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    this.bookingId = `CTS-${stamp}-${rand}`;
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
