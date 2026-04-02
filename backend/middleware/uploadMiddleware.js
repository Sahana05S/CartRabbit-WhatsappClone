const multer = require('multer');
const path   = require('path');
const crypto = require('crypto');

// Allowed MIME types
const ALLOWED_TYPES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Videos
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
  'video/x-msvideo', 'video/x-matroska', 'video/3gpp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  'text/plain', 'text/csv',
  // Archives
  'application/zip', 'application/x-zip-compressed',
]);

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type "${file.mimetype}" is not allowed.`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter,
});

/**
 * Middleware to catch multer errors and return a clean JSON response.
 * Must be used AFTER upload.single() / upload.array() in the route.
 * Without this, multer errors crash the process instead of being
 * handled gracefully by Express's global error handler.
 */
const multerErrorHandler = (err, req, res, next) => {
  if (!err) return next();

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: `File too large. Maximum allowed size is ${MAX_SIZE_BYTES / (1024 * 1024)} MB.`,
    });
  }

  if (err.message && err.message.includes('not allowed')) {
    return res.status(415).json({
      success: false,
      message: err.message,
    });
  }

  // Any other multer / busboy error
  console.error('Upload error:', err);
  return res.status(500).json({ success: false, message: 'File upload failed.' });
};

module.exports = { upload, multerErrorHandler };
