const admin = require("firebase-admin");

const loadServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  throw new Error("Firebase Admin not configured");
};

const getFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin;
  }

  admin.initializeApp({
    credential: admin.credential.cert(loadServiceAccount()),
  });

  return admin;
};

module.exports = { getFirebaseAdmin };
