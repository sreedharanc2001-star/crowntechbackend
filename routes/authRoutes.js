const express = require("express");
const {
  register,
  login,
  firebaseLogin,
  sendTwilioOtp,
  verifyTwilioOtp,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/firebase-login", firebaseLogin);
router.post("/twilio/send-otp", sendTwilioOtp);
router.post("/twilio/verify-otp", verifyTwilioOtp);

module.exports = router;
