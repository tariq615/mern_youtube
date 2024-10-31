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
  getChannelUserprofile
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

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/getuser").post(verifyJWT, getCurrentUser)

router.route("/edit/details").post(verifyJWT, updateAccountDetails)

router.route("/edit/avatar").post(upload.single('avatar'), verifyJWT, updateUserAvatar)

router.route("/edit/coverimage").post(upload.single('coverimage'), verifyJWT, updateUserCoverImage)

router.route("/:username").post(verifyJWT, getChannelUserprofile)

export default router;
