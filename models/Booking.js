const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookingId: { type: String, unique: true, index: true },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    userPhone: { type: String, trim: true, default: "" },
    serviceType: { type: String, required: true, trim: true },
    deviceModel: { type: String, required: true, trim: true },
    issue: { type: String, required: true, trim: true },
    issueCategory: { type: String, trim: true, default: "" },
    aiConfidence: { type: Number, default: null },
    aiSource: { type: String, trim: true, default: "" },
    aiNotes: { type: String, trim: true, default: "" },
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

bookingSchema.pre("save", async function onSave() {
  if (!this.bookingId) {
    const count = await this.constructor.countDocuments();
    this.bookingId = `crowntechorder-${count + 1}`;
  }
});

module.exports = mongoose.model("Booking", bookingSchema);
