const { test } = require('node:test');
const assert = require('node:assert/strict');

const router = require('../routes/authRoutes');

test('auth router exposes register/login/firebase/twilio auth routes', () => {
  const postRoutes = router.stack
    .filter((layer) => layer.route && layer.route.methods && layer.route.methods.post)
    .map((layer) => layer.route.path)
    .sort();

  assert.deepStrictEqual(postRoutes, [
    '/firebase-login',
    '/login',
    '/register',
    '/twilio/send-otp',
    '/twilio/verify-otp',
  ]);
});
