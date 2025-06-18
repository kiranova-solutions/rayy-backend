const router = require("express").Router();

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const cpUpload = upload.fields([{ name: "files" }]);

const {
  generateUploadURLController,
  downloadImageAndUploadToS3Controller,
  handleFilesUploadController,
} = require("../controllers/s3.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/generateUploadURL",  generateUploadURLController);

router.post(
  "/uploadToS3",
  downloadImageAndUploadToS3Controller
);

router.post(
  "/uploadToS3UsingFormData",
  authMiddleware,
  cpUpload,
  handleFilesUploadController
);

module.exports = router;
