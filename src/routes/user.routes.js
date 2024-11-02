import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getChannelUserProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverimage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").patch(verifyJWT, changeCurrentPassword);

router.route("/getuser").get(verifyJWT, getCurrentUser);

router.route("/edit/details").patch(verifyJWT, updateAccountDetails);

router
  .route("/edit/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
  .route("/edit/coverimage")
  .patch(verifyJWT, upload.single("coverimage"), updateUserCoverImage);

router.route("/c/:username").get(verifyJWT, getChannelUserProfile);

router.route("/watch-history").get(verifyJWT, getWatchHistory)
export default router;
