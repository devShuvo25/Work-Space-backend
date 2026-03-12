import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// 1. Setup Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

// 2. Setup Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'workspace_media',
      allowed_formats: ['jpg', 'png', 'pdf'],
      resource_type: 'auto', // Important: 'auto' allows both images and PDFs
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

export const upload = multer({ storage: storage });