const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not set");
    }
    // Fail fast if we can't reach the cluster, and avoid buffering queries
    mongoose.set("bufferCommands", false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = connectDB;
