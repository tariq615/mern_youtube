import multer from "multer";
import { v4 as uuidv4 } from 'uuid';
import ApiError from './path/to/ApiError';  // Adjust this path based on your setup

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp');
  },
  filename: function (req, file, cb) {
    // Combine uuid and original filename
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "thumbnail") {
    // Only allow image files for thumbnail
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Thumbnail must be an image"), false);
    }
  } else if (file.fieldname === "videoFile") {
    // Only allow video files for videoFile
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Video file must be a video"), false);
    }
  } else {
    cb(new ApiError(400, "Invalid field name"), false);
  }
};

export const upload = multer({ storage, fileFilter });