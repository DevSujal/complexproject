import { Router } from "express";
import userController from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()


router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },{
            name: "coverImage",
            maxCount: 1
        }
    ]), userController.registerUser)

router.route("/login").post(userController.loginUser)

// secured routes

// registerUser,
// loginUser,
// logoutUser,
// refreshAccessToken,
// changeCurrentUserPassword,
// getCurrentUser,
// updateDetails,
// updateDetails,
// updateUserAvatar,
// updateUserCoverImage,
// deleteUser,
// getUserChannelProfile,
// getWatchHistory,

router.route("/logout").post(verifyJwt, userController.logoutUser)
router.route("/refresh-token").post(userController.refreshAccessToken)
router.route("/change-password").post(verifyJwt, userController.changeCurrentUserPassword)
router.route("/current-user").post(verifyJwt, userController.getCurrentUser)
router.route("/update-account").patch(verifyJwt, userController.getCurrentUser)
router.route("/avatar").patch(verifyJwt, upload.single("avatar"), userController.updateUserAvatar)
router.route("/cover-image").patch(verifyJwt, upload.single("coverImage"), userController.updateUserCoverImage)
router.route("/c/:username").get(verifyJwt, userController.getUserChannelProfile)
router.route("/history").get(verifyJwt, userController.getWatchHistory)

export default router