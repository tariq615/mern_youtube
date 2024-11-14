import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getPublicIdFromUrl = (cloudinaryUrl) => {
  // Extract everything after "image/upload/" or "video/upload/"
  const path =
    cloudinaryUrl.split("/image/upload/")[1] ||
    cloudinaryUrl.split("/video/upload/")[1];
  if (!path) throw new Error("Invalid Cloudinary URL format.");

  // Remove version prefix if it exists
  const parts = path.split("/");
  if (parts[0].startsWith("v")) {
    parts.shift(); // Remove the version part
  }

  return parts.join("/").split(".")[0]; // Keep full path without the file extension
};

const deleteFromCloudinary = async (cloudinaryUrl) => {
  try {
    if (!cloudinaryUrl) throw new Error("Error: URL not provided");

    const publicId = getPublicIdFromUrl(cloudinaryUrl);

    const response = await cloudinary.uploader.destroy(publicId);

    if (response.result !== "ok") {
      throw new Error("Failed to delete image from Cloudinary");
    }

    return response;
  } catch (error) {
    console.error(error.message || "Failed to delete from Cloudinary");
    throw error;
  }
};

export { deleteFromCloudinary };
