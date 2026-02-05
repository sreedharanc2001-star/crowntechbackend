const express = require("express");
const router = express.Router();

router.post("/chat", (req, res) => {
  const raw = req.body.message || "";
  const message = raw.toLowerCase();

  let reply =
    "I can help with bookings, status tracking, and quick troubleshooting. What would you like to do?";

  if (message.includes("hi") || message.includes("hello") || message.includes("hey")) {
    reply =
      "Hi there! I can help you book a service, track your booking, or answer quick troubleshooting questions.";
  } else if (message.includes("thanks") || message.includes("thank you")) {
    reply = "You're welcome! Anything else I can help you with?";
  } else if (message.includes("book") || message.includes("booking")) {
    reply =
      "To book a service, share your device model, issue, and preferred date/time. You can also use the booking form on the website.";
  } else if (message.includes("track") || message.includes("status")) {
    reply =
      "You can track your service using your registered phone number or email. Use the Track Status section to view updates.";
  } else if (message.includes("price") || message.includes("cost")) {
    reply =
      "Pricing depends on the issue and device model. Once you book, our team will confirm the exact cost.";
  } else if (message.includes("time") || message.includes("how long")) {
    reply =
      "Most repairs are completed within 24-48 hours depending on parts availability.";
  } else if (message.includes("screen")) {
    reply = "Screen issues usually take 1-2 days to repair.";
  } else if (message.includes("battery")) {
    reply = "Battery replacement takes around 1 day.";
  } else if (message.includes("cost")) {
    reply = "Cost depends on the issue. Our team will contact you.";
  }

  res.json({ reply });
});

module.exports = router;
