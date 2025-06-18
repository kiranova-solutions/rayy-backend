require("dotenv").config();
const axios = require("axios");
const AWS = require("aws-sdk");
const crypto = require("crypto");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const randomBytes = promisify(crypto.randomBytes);

const region = "ap-south-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Prev = new AWS.S3({
  region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: "v4",
});

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  region: region,
});

async function downloadImageAndUploadToS3(imageUrl, s3Bucket) {
  try {
    if (!imageUrl) {
      return null;
    }

    // console.log('imageUrl: ', imageUrl);
    // console.log('s3Bucket: ', s3Bucket);

    // Step 1: Download image from URL
    const response = await axios({
      url: imageUrl,
      responseType: "stream", // Get response as a stream for efficient handling of large files
    });

    // Step 2: Generate a random name for the image file
    const ext = path.extname(imageUrl); // Get file extension
    const rawBytes = await randomBytes(16);
    const imageName = rawBytes.toString("hex");

    // Step 3: Upload image to S3
    const uploadParams = {
      Bucket: s3Bucket || "rayy/Others",
      Key: `${imageName}${ext}`,
      Body: response.data,
      ContentType: response.headers["content-type"],
    };

    const data = await s3Prev.upload(uploadParams).promise();
    console.log(`Image uploaded successfully to ${data.Location}`);
    return data.Location;
  } catch (error) {
    console.log("Error downloading or uploading image:", error);
    throw error;
  }
}

async function generateUploadURL(fileType, bucketName) {
  const rawBytes = await randomBytes(16);
  const imageName = rawBytes.toString("hex");

  const params = {
    Bucket: bucketName || "rayy/Others",
    Key: `${imageName}.${fileType}`,
    Expires: 60,
  };

  const uploadURL = await s3Prev.getSignedUrlPromise("putObject", params);
  return uploadURL;
}

const handleFilesUpload = async (filesObj, bucketName, directory) => {
  if (!filesObj || !filesObj.files) return [];

  const files = filesObj.files;
  return await Promise.all(
    files.map(async (file, index) => {
      const originalKey = `${directory}/${Date.now().toString()}-${
        file.originalname
      }`;
      const fullURL = `https://${bucketName}.s3.${region}.amazonaws.com/${originalKey}`;

      await S3upload(file.path, originalKey, bucketName);

      // DELETE the file from uploads folder
      try {
        fs.unlinkSync(file.path); // This deletes the uploaded file
        console.log(`Deleted local file: ${file.path}`);
      } catch (err) {
        console.error(`Error deleting file ${file.path}:`, err);
      }

      return {
        key: originalKey,
        url: fullURL,
      };
    })
  );
};

const S3upload = async (filePath, key, bucketName) => {
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: bucketName || "rayy",
    Key: key,
    Body: fileContent,
  };

  await s3.send(new PutObjectCommand(params));
};

module.exports = {
  downloadImageAndUploadToS3,
  generateUploadURL,
  handleFilesUpload,
};
