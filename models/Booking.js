const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    device: { type: String, required: true, trim: true },
    issue: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    approval: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    comment: { type: String, trim: true, default: "" },
    completionMessage: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
