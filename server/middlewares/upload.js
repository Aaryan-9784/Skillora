const multer     = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const ApiError   = require("../utils/ApiError");

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const makeStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder:         `skillora/${folder}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "pdf"],
      transformation: folder === "avatars" ? [{ width: 400, height: 400, crop: "fill" }] : [],
    },
  });

// Fallback to memory storage when Cloudinary not configured
const memoryStorage = multer.memoryStorage();

const makeUpload = (folder, fieldName = "file", maxSizeMB = 10) => {
  const storage = process.env.CLOUDINARY_CLOUD_NAME ? makeStorage(folder) : memoryStorage;

  return multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|webp|gif|pdf/;
      if (allowed.test(file.mimetype)) return cb(null, true);
      cb(ApiError.badRequest("File type not allowed"));
    },
  }).single(fieldName);
};

const uploadAvatar  = makeUpload("avatars",  "avatar",  5);
const uploadFile    = makeUpload("files",    "file",    20);

module.exports = { uploadAvatar, uploadFile, cloudinary };
