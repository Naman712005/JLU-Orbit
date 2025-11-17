const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Cloudinary storage for multer
const storage = isCloudinaryConfigured()
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'fastconnect',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
      },
    })
  : require('multer').diskStorage({
      destination: (req, file, cb) => {
        const path = require('path');
        cb(null, path.join(__dirname, '..', 'uploads'));
      },
      filename: (req, file, cb) => {
        const path = require('path');
        cb(null, Date.now() + path.extname(file.originalname));
      },
    });

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = {
  cloudinary,
  upload,
  isCloudinaryConfigured,
};
