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
    params: async (req, file) => {
      const isAudioOrVideo = file.mimetype.startsWith("audio/") || file.mimetype.startsWith("video/") || file.originalname.match(/\.(webm|wav|mp3|ogg|m4a|mp4)$/i);
      const isImage = file.mimetype.startsWith("image/");
      
      let resource_type = "raw";
      if (isImage) resource_type = "image";
      else if (isAudioOrVideo) resource_type = "video";

      let ext = "webm";
      if (file.originalname && file.originalname.includes(".")) {
        ext = file.originalname.substring(file.originalname.lastIndexOf(".") + 1).toLowerCase();
      }

      return {
        folder: `skillora/${folder}`,
        resource_type,
        format: isAudioOrVideo ? ext : undefined,
        transformation: folder === "avatars" ? [{ width: 400, height: 400, crop: "fill" }] : [],
      };
    },
  });

// Fallback to memory storage when Cloudinary not configured
const memoryStorage = multer.memoryStorage();

const makeUpload = (folder, fieldName = "file", maxSizeMB = 50) => {
  const storage = process.env.CLOUDINARY_CLOUD_NAME ? makeStorage(folder) : memoryStorage;

  return multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      // Allow images, audio, video, pdf, office docs, archives, text
      const allowedRegex = /jpeg|jpg|png|webp|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|txt|csv|audio|video|mp3|wav|webm|ogg|m4a|mp4/;
      const isAllowed = allowedRegex.test(file.mimetype.toLowerCase()) || allowedRegex.test(file.originalname.toLowerCase());
      if (isAllowed) return cb(null, true);
      cb(ApiError.badRequest("File type not allowed"));
    },
  }).single(fieldName);
};

const uploadAvatar  = makeUpload("avatars",  "avatar",  5);
const uploadFile    = makeUpload("files",    "file",    50);

module.exports = { uploadAvatar, uploadFile, cloudinary };
