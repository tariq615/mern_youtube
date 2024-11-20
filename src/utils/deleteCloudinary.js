import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Extract publicId using regex
const getPublicIdFromUrl = (cloudinaryUrl) => {
  const regex =
    /\/(?:image|video)\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/;
  const match = cloudinaryUrl.match(regex);

  if (!match || !match[1]) throw new Error("Invalid Cloudinary URL format.");

  return match[1]; // Public ID is in the first capture group
};

const deleteFromCloudinary = async (cloudinaryUrl) => {
  try {
    if (!cloudinaryUrl) throw new Error("Error: URL not provided");

    const publicId = getPublicIdFromUrl(cloudinaryUrl);

    const resourceType = cloudinaryUrl.includes("/video/") ? "video" : "image";

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (response.result !== "ok") {
      throw new Error("Failed to del from Cloudinary");
    }

    return response;
  } catch (error) {
    console.error(error.message || "Failed to delete from Cloudinary");
    throw error;
  }
};

export { deleteFromCloudinary };
