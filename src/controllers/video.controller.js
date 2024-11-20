import { mongoose, isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteCloudinary.js";
import { isValid } from "../utils/isValid.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  // Convert page and limit to integers
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  // Calculate the number of documents to skip
  const skip = (pageNumber - 1) * limitNumber;
  const pipeline = [];

  if (query) {
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          query: query,
          path: ["title", "description"],
        },
      },
    });
  }

  if (userId) {
    if (!isValidObjectId(userId)) throw new ApiError(400, "user not exist");
    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  pipeline.push({
    $match: {
      isPublished: true,
    },
  });

  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $arrayElemAt: ["$owner", 0],
        },
      },
    }
  );

  // Add pagination stages
  pipeline.push({ $skip: skip }, { $limit: limitNumber });

  const videoAggregate = await Video.aggregate(pipeline);

  // console.log(pipeline);

  return res
    .status(200)
    .json(new ApiResponse(200, videoAggregate, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;
  // TODO: get video, upload to cloudinary, create video

  // Validate required fields
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  console.log(isPublished);

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Both video file and thumbnail are required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  console.log(videoFile);
  console.log(thumbnail);
  
  if (!videoFile)
    throw new ApiError(500, "videoFile error during uploading on cloudinary");

  if (!thumbnail)
    throw new ApiError(500, "thumbnail error during uploading on cloudinary");

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: videoFile.duration,
    isPublished: isPublished !== undefined ? isPublished : true,
    owner: req.user?._id,
  });

  const createdVideo = await Video.findById(video._id);

  if (!video) {
    throw new ApiError(500, "Internal server error");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  // Checking videoId is valid
  isValid(videoId);

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              fullName: 1,
              avatar: 1,
              coverimage: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $arrayElemAt: ["$owner", 0] },
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  isValid(videoId);

  if (!title || !description) {
    throw new ApiError(400, "both field are required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "no such video exist");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    console.log(video.owner);
    console.log(req.user?._id);
    
    throw new ApiError(404, "only the user has the rights to update");
  }

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) throw new ApiError(400, "thumbnail is required");

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail)
    throw new ApiError(500, "Error during uploading on cloudinary");

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url,
      },
    },
    {
      new: true,
    }
  );

  if (updatedVideo) {
    await deleteFromCloudinary(video.thumbnail);
  } else {
    throw new ApiError(500, "connection error, please try again later");
  }

  return res
    .status(200)
    .json(new ApiResponse(500, updatedVideo, "Data updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate the video ID
  isValid(videoId);

  // Find the video in the database
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "No video found");
  }

  // Check if the requesting user is the owner
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  // Delete video files from Cloudinary
  try {
    await Promise.all([
      deleteFromCloudinary(video.videoFile),
      deleteFromCloudinary(video.thumbnail),
    ]);
  } catch (error) {
    throw new ApiError(500, "Failed to delete video files from Cloudinary");
  }
  // Delete the video document from the database
  await video.deleteOne();

  // Send response
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  isValid(videoId);

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "no such video exist");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "only the user has the rights to update");
  }

  video.isPublished = !video.isPublished;
  const status = await video.save({ validateBeforeSave: false });

  if (!status) {
    throw new ApiError(500, "failed to update try again later");
  }

  return res.status(200).json(new ApiResponse(200, status, "status updated"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
