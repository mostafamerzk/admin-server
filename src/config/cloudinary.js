import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Cloudinary Configuration
 * Configure cloudinary with environment variables
 */
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SEC,
  secure: true
});

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} folder - Cloudinary folder name
 * @param {string} publicId - Optional public ID for the image
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = (fileBuffer, folder = 'products', publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto'
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} Cloudinary deletion result
 */
export const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

/**
 * Get optimized image URL
 * @param {string} publicId - Public ID of the image
 * @param {Object} options - Transformation options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto'
  };

  return cloudinary.url(publicId, { ...defaultOptions, ...options });
};

export default cloudinary;
