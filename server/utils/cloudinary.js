const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');

// Configure Cloudinary with credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload an image to Cloudinary
 * @param {string} imagePath - Path to the local image file
 * @param {string} folder - Cloudinary folder to store the image
 * @returns {Promise} Cloudinary upload result
 */
const uploadImage = async (imagePath, folder = 'profiles') => {
  try {
    // Upload the image to Cloudinary
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: folder,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      transformation: [
        { width: 400, height: 400, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    // Remove the local file after successful upload
    fs.unlinkSync(imagePath);
    
    return result;
  } catch (error) {
    // Remove the local file if upload fails
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    throw error;
  }
};

/**
 * Upload an image from URL to Cloudinary (for Google profile pictures)
 * @param {string} imageUrl - URL of the image
 * @param {string} folder - Cloudinary folder to store the image
 * @returns {Promise} Cloudinary upload result
 */
const uploadImageFromUrl = async (imageUrl, folder = 'profiles') => {
  try {
    // Upload the image directly from URL
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: folder,
      use_filename: false,
      unique_filename: true,
      transformation: [
        { width: 400, height: 400, crop: 'limit' },
        { quality: 'auto' }
      ]
    });
    
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = { uploadImage, uploadImageFromUrl };
