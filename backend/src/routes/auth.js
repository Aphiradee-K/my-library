const express = require("express");

const {
  register,
  login,
  demo,
  logout,
  me,
} = require("../controllers/authController");
const { requireAuth } = require("../auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/demo", demo);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

module.exports = router;
