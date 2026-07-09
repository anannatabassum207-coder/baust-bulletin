const express = require("express");
const multer = require("multer");
const postController = require("../controllers/postController");
const { isLoggedIn } = require("../middleware/authMiddleware");

const router = express.Router();

const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/posts");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const uploadPost = multer({ storage: postStorage });

router.get("/feed", isLoggedIn, postController.feed);
router.get("/search", isLoggedIn, postController.searchPage);
router.get("/notifications", isLoggedIn, postController.notificationsPage);
router.get("/announcements", isLoggedIn, postController.announcementsPage);

router.post("/create", isLoggedIn, uploadPost.single("image"), postController.createPost);
router.post("/like/:id", isLoggedIn, postController.likePost);
router.post("/comment/:id", isLoggedIn, postController.commentPost);
router.post("/report/:id", isLoggedIn, postController.reportPost);
router.post("/delete/:id", isLoggedIn, postController.deletePost);
module.exports = router;