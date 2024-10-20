import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

  const { fullName, email, username, password } = req.body;

  console.log(email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }

  const userExisted = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExisted) {
    if (userExisted.username === username) {
      throw new ApiError(409, "Username already taken");
    }

    if (userExisted.email === email) {
      throw new ApiError(409, "Email already taken");
    }
  }

  const avatarLocalpath = req.files?.avatar[0]?.path;
  const coverimageLocalPath = req.files?.coverimage[0]?.path;

  if (!avatarLocalpath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalpath);
  const coverimage = await uploadOnCloudinary(coverimageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    username: username.trim().lowercase(),
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverimage: coverimage?.url || ""
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  
  if(!createdUser){
    throw new ApiError(400, "Internal server error while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User Registered successfully")
  )
});

export { registerUser };
