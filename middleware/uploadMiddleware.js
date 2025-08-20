// middleware/uploadMiddleware.js

import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path'; // We still need this

dotenv.config();

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
  const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing Cloudinary environment variables:', missingVars);
    throw new Error(`Missing Cloudinary configuration: ${missingVars.join(', ')}`);
  }
  
  console.log('✅ Cloudinary configuration validated');
};

try {
  validateCloudinaryConfig();
  
  cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
  });
} catch (error) {
  console.error('❌ Cloudinary configuration error:', error.message);
  // Continue without Cloudinary - will use local storage as fallback
}

export const bookUpload = multer({
    storage: new CloudinaryStorage({
        cloudinary: cloudinary,
        params: (req, file) => {
            // --- THIS IS THE CORRECTED AND FINAL LOGIC ---

            // 1. Get the original filename without the extension
            const name = path.parse(file.originalname).name
                            .replace(/\s+/g, '_') // Replace spaces with underscores for cleaner URLs
                            .toLowerCase();

            // 2. Get the file extension (e.g., "epub", "txt")
            const format = path.extname(file.originalname).substring(1);

            // 3. Create a unique suffix
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

            // 4. Determine the folder and resource type
            let folder, resource_type;
            if (file.fieldname === 'coverImage') {
                folder = 'book-covers';
                resource_type = 'image';
            } else if (file.fieldname === 'bookFile') {
                folder = 'book-files';
                resource_type = 'raw';
            } else {
                folder = 'uploads';
                resource_type = 'auto';
            }

            // 5. Return all the necessary parameters
            return {
                folder: folder,
                resource_type: resource_type,
                // Set the base name of the file
                public_id: `${name}-${uniqueSuffix}`,
                // Explicitly tell Cloudinary the format to use
                format: format,
            };
        }
    })
});

// Audio upload middleware for Cloudinary
export const audioUpload = multer({
    storage: new CloudinaryStorage({
        cloudinary: cloudinary,
        params: (req, file) => {
            // 1. Get the original filename without the extension
            const name = path.parse(file.originalname).name
                            .replace(/\s+/g, '_') // Replace spaces with underscores for cleaner URLs
                            .toLowerCase();

            // 2. Get the file extension (e.g., "mp3", "wav", "webm")
            const format = path.extname(file.originalname).substring(1);

            // 3. Create a unique suffix
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

            // 4. Audio files go to audio folder with video resource type (for better streaming)
            return {
                folder: 'audio-files',
                resource_type: 'video', // Cloudinary treats audio as video for better streaming
                // Set the base name of the file
                public_id: `${name}-${uniqueSuffix}`,
                // Explicitly tell Cloudinary the format to use
                format: format,
                // Audio-specific transformations
                transformation: [
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            };
        }
    }),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        console.log('🔍 Audio file received for upload:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });
        
        // Accept audio files only
        const allowedMimes = [
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/ogg',
            'audio/webm',
            'audio/x-m4a',
            'audio/webm;codecs=opus',
            'audio/m4a',
            'audio/aac',
            'audio/flac',
        ];

        if (allowedMimes.includes(file.mimetype)) {
            console.log('✅ Audio file type accepted:', file.mimetype);
            cb(null, true);
        } else {
            console.log('❌ Audio file type rejected:', file.mimetype);
            cb(new Error(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`));
        }
    }
});