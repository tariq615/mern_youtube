import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getPublicIdFromUrl = (cloudinaryUrl) => {
  // Assuming the URL has the format: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}
  const parts = cloudinaryUrl.split("/");
  return parts[parts.length - 1].split(".")[0]; // Extracts the public ID without the file extension
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
