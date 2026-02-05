require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");

const app = express();

const startServer = async () => {
  try {
    // Connect Database
    await connectDB();

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || "Admin";

    if (email && password) {
      const hashed = await bcrypt.hash(password, 10);
      const adminEmail = email.toLowerCase();
      const existingAdminByEmail = await User.findOne({ email: adminEmail });

      if (existingAdminByEmail) {
        await User.updateOne(
          { email: adminEmail },
          { $set: { name, password: hashed, role: "admin" } }
        );
        console.log("Default admin updated");
      } else {
        const existingAdminByRole = await User.findOne({ role: "admin" });
        if (existingAdminByRole) {
          await User.updateOne(
            { _id: existingAdminByRole._id },
            { $set: { name, email: adminEmail, password: hashed, role: "admin" } }
          );
          console.log("Default admin updated (role match)");
        } else {
          await User.create({
            name,
            email: adminEmail,
            password: hashed,
            role: "admin",
          });
          console.log("Default admin created");
        }
      }
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/chatbot", require("./routes/chatbotRoutes"));
app.use("/api/services", require("./routes/servicesRoutes"));


app.get("/", (req, res) => {
  res.send("Mobile Service Backend Running");
});

const PORT = process.env.PORT || 5000;

startServer();
