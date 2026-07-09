const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { isLoggedIn, isAdmin } = require("../middleware/authMiddleware");

router.get("/dashboard", isLoggedIn, isAdmin, adminController.dashboard);
router.post("/announcement", isLoggedIn, isAdmin, adminController.createAnnouncement);
router.get("/delete-post/:id", isLoggedIn, isAdmin, adminController.adminDeletePost);
router.get("/block-user/:id", isLoggedIn, isAdmin, adminController.blockUser);

module.exports = router;