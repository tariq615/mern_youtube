import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

      // Extended list of video file extensions
    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm', 'mpeg', 'mpg', '3gp', 'ogv'];
    const fileType = localFilePath.match(/\.(\w+)$/)?.[1].toLowerCase();

    // Determine folder based on file type
    const folder = videoExtensions.includes(fileType) ? 'videos_folder' : 'images_folder';


    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: folder
    });
    // console.log("File uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath)
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath)  // remove the locally saved temporary file as the operation got failed
    return null
  }
};


export {uploadOnCloudinary}