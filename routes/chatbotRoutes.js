const express = require("express");
const router = express.Router();

router.post("/chat", (req, res) => {
  const raw = req.body.message || "";
  const message = raw.toLowerCase();

  let reply = "Please contact service center.";

  if (message.includes("screen")) {
    reply = "Screen issues usually take 1-2 days to repair.";
  } else if (message.includes("battery")) {
    reply = "Battery replacement takes around 1 day.";
  } else if (message.includes("cost")) {
    reply = "Cost depends on the issue. Our team will contact you.";
  }

  res.json({ reply });
});

module.exports = router;
