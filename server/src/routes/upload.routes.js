const express = require('express');
const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const { protect } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload endpoints
 */

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

router.post('/', protect, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files provided' });
    }

    const results = await Promise.all(
      req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const isVideo = file.mimetype.startsWith('video/');
          const stream = cloudinary.uploader.upload_stream(
            { 
              folder: 'greenalert', 
              resource_type: isVideo ? 'video' : 'image',
              ...(isVideo ? { video_codec: 'h264' } : {}),
            },
            (error, result) => {
              if (error) reject(error);
              else resolve({ url: result.secure_url, publicId: result.public_id, type: isVideo ? 'video' : 'image' });
            }
          );
          stream.end(file.buffer);
        });
      })
    );

    return res.status(200).json({
      success: true,
      data: { urls: results.map((r) => r.url), publicIds: results.map((r) => r.publicId) },
    });
  } catch (error) {
    logger.error('Upload error:', error);
    return res.status(500).json({ success: false, message: 'Image upload failed' });
  }
});

module.exports = router;
