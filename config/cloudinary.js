import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'book-covers', // Folder in Cloudinary to store cover images
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
  },
});

const bookFileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "book-files", // Folder for book files
    resource_type: "raw",  // Use 'raw' for non-image files
    allowed_formats: ["epub", "txt", "pdf"],
    type: "upload",        // Ensures public accessibility
  },
});


export { cloudinary, storage, bookFileStorage };
