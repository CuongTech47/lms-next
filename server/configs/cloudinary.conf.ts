require('dotenv').config();
import { v2 as cloudinary } from 'cloudinary';
const cloudinaryConfig = () => {
    try {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_SECRET_KEY,
        });
    
        console.log('Cloudinary ket noi thanh cong!');
      } catch (error) {
        console.error('Cloudinary connection failed:', error);
      }
};

export default cloudinaryConfig;