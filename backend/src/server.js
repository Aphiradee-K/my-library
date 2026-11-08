const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test API
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to My Library API!",
    status: "Server is running",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`My Library API running on port ${PORT}`);
});