import { mongoose } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValid } from "../utils/isValid.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  isValid(channelId);

  // Check if the channel user exists
  const channelUser = await User.findById(channelId);
  if (!channelUser) {
    throw new ApiError(404, "Channel user not found");
  }

  // Check if the user is already subscribed
  const isSubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (isSubscribed) {
    // Unsubscribe if already subscribed
    const deletedSubscription = await Subscription.findByIdAndDelete(
      isSubscribed._id
    );

    if (!deletedSubscription) {
      throw new ApiError(500, "Failed to unsubscribe");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { subscribed: false }, "Successfully unsubscribed")
      );
  }

  // Subscribe if not already subscribed
  const newSubscription = await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (!newSubscription) {
    throw new ApiError(500, "Failed to subscribe");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscribed: true, subscription: newSubscription },
        "Successfully subscribed"
      )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  isValid(channelId);

  if (channelId.toString() !== req.user?._id.toString()) {
    return res
      .status(403)
      .json(
        new ApiResponse(
          403,
          {},
          "You are not authorized to view this channel's subscribers"
        )
      );
  }

  const subscriberDetails = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribersOfSubscriber",
              pipeline: [
                {
                  $addFields: {
                    subscribers: "$subscriber",
                  },
                },
                {
                  $project: {
                    subscribers: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              isMutuallySubscribed: {
                $in: [
                  new mongoose.Types.ObjectId(channelId),
                  "$subscribersOfSubscriber.subscribers",
                ],
              },
            },
          },
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
              isMutuallySubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        subscriber: { $arrayElemAt: ["$subscriber", 0] },
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriberDetails,
        "subscriber details fetched successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  isValid(subscriberId);

  const subscribedTo = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
              countSubscribers: { $size: "$subscribers" },
            },
          },
        ],
      },
    },
    {
      $project: {
        channel: { $arrayElemAt: ["$channel", 0] },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedTo,
        "Fetched subscribed channels successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
