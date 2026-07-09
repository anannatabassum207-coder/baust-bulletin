const express = require("express");
const path = require("path");
const multer = require("multer");
const authController = require("../controllers/authController");
const { isLoggedIn } = require("../middleware/authMiddleware");

const router = express.Router();

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/profiles");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const uploadProfile = multer({ storage: profileStorage });

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/login.html"));
});

router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/register.html"));
});

router.post("/login", authController.login);
router.post("/register", uploadProfile.single("profile"), authController.register);
router.get("/logout", authController.logout);

router.get("/profile", isLoggedIn, authController.profilePage);
router.post("/profile/update", isLoggedIn, uploadProfile.single("profile"), authController.updateProfile);

module.exports = router;