// middleware/uploadMiddleware.js

import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path'; // We still need this

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

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