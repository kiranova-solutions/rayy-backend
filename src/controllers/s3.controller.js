const {
  generateUploadURL,
  downloadImageAndUploadToS3,
  handleFilesUpload,
} = require("../config/s3");

const generateUploadURLController = async (req, res) => {
  const fileType = req?.body?.fileType;
  const bucketName = req?.body?.bucketName;

  try {
    const url = await generateUploadURL(fileType, bucketName);
    res.status(200).send({ url });
  } catch (error) {
    console.log("Error generating S3 upload URL:", error);
    res.status(500).send({
      success: false,
      message: "Error generating S3 upload URL. Please try again.",
    });
  }
};

const downloadImageAndUploadToS3Controller = async (req, res) => {
  const imageURL = req?.body?.imageURL;
  const bucketName = req?.body?.bucketName;

  try {
    const url = await downloadImageAndUploadToS3(imageURL, bucketName);
    res.status(200).send({ url });
  } catch (error) {
    console.log("Error uploading image to S3:", error);
    res.status(500).send({
      success: false,
      message: "Error uploading image to S3. Please try again.",
    });
  }
};

const handleFilesUploadController = async (req, res) => {
  console.log("req.files", req.files);
  const files = req.files;
  const { bucketName, directory } = req?.body;

  try {
    const values = await handleFilesUpload(files, bucketName, directory);
    res.status(200).send({ success: true, values });
  } catch (error) {
    console.log("Error generating S3 upload URL:", error);
    res.status(500).send({
      success: false,
      message: "Error generating S3 upload URL. Please try again.",
    });
  }
};

module.exports = {
  generateUploadURLController,
  downloadImageAndUploadToS3Controller,
  handleFilesUploadController,
};
