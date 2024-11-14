import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteCloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  if (isNaN(page) || isNaN(limit))
    throw new ApiError(400, "page and limit must be a number");

  if (userId) {
    if (!isValidObjectId(userId)) throw new ApiError(400, "user not exist");
  }

  // Initialize filter based on query parameters

  const filter = {};
  if (userId) filter.owner = userId;
  if (query) filter.title = { $regex: query, $options: "i" };

  // Set sort order and pagination skip
  const sortOptions = { [sortBy]: sortType === "asc" ? 1 : -1 };
  const skip = (page - 1) * limit;

  // Retrieve paginated and sorted videos based on filter
  const allVideos = await Video.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  // Get total count of videos matching filter and calculate pagination details
  const countVideos = await Video.countDocuments(filter);
  const pagination = {
    countVideos,
    countPages: Math.ceil(countVideos / limit),
    page: page,
    limit: limit,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { allVideos, pagination },
        "Videos fetched successfully"
      )
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  // Validate required fields
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Both video file and thumbnail are required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

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
    owner: req.user?._id,
  });

  // const createdVideo = await Video.findById(video._id);

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
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "no such video exist");
  }

  const video = await Video.findById(videoId);
  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "no such video exist");
  }

  const video = await Video.findById(videoId);

  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "both field are required");
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

  await deleteFromCloudinary(video.thumbnail);

  return res
    .status(200)
    .json(new ApiResponse(500, updatedVideo, "Data updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
