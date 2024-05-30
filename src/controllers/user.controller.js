import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { uploadOnCloudianary } from "../utils/Cloudianary.js";
import { deleteFromCloudianary } from "../utils/DeleteFromCloudianaru.js";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    console.log(accessToken, refreshToken);

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating refresh and access token"
    );
  }
};
// Register user controller
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation of details - not empty
  // check if user already exists : username or email
  //  files hai ya nahi - prominantly avatar
  //upload them to cloudianary, avatar check
  // create user object - creation call : create entrys in db
  // remove password and refresh token field from respose
  //  chekc for user creation
  // return response

  const { username, email, fullname, password } = req.body;

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (user) {
    throw new ApiError(409, "User with email or username Already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path; // file ka path lene ke liye multer ne local path
  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Is Required");
  }

  const avatar = await uploadOnCloudianary(avatarLocalPath);
  let coverImage;
  coverImage = await uploadOnCloudianary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar Is Required ");
  }

  const userCreated = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });

  const userFound = await User.findById(userCreated._id).select(
    "-password -refreshToken"
  );

  if (!userFound) {
    throw new ApiError(500, "somthing went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponce(200, userFound, "user registerd successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // extract username and password from req.body
  // check username or email and password matches to the database or not
  // generate the access token
  // generate the refresh token
  // store the refresh token in the form of cookie in frontend
  // now above three steps are for if the user close the app and again open the app after few hours then there must be refresh token so that user does not have to login again
  // now we have to check if the refresh token is valid or not
  // then after all the we have to redirect user to the home page

  const { username, email, password } = req.body;

  if (!username && !email)
    throw new ApiError(400, "username or email required");

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // cookies

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponce(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findOneAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiError(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // we refresh Token
  // when we got 401 error then we have to hit one end point which leads to wake up these controller
  // we can extract refresh token from cookies and also we have refresh token in our database
  // now we can compare them if they are same then
  // we dont need to request user to login again

  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken === user?.refreshToken)
      throw new ApiError(401, "Refresh Token is Expired or Used");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    const option = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", refreshAccessToken, option)
      .json(
        new ApiResponce(
          200,
          {
            user,
            accessToken,
            refreshToken,
          },
          "User Successfully LoggedIn"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message, "Invalid refresh Token");
  }
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid Password");
  }

  // if(! (newPassword === confirmPassword)){
  //   throw new ApiError(400, "new Password and confirm password are not same")
  // }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponce(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});

const updateDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "fullname and email are required for change");
  }

  const user = User.findByIdAndUpdate(
    // for multiple updates in database
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponce(200, user, "Accounts details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // get the avatar from local storage using req.files?.avatar[0]?.path -> ye ek se jyada ke liye
  //upload the avatar from cloudinary
  // check the avatar is uploaded or not
  // update the database
  // delete from cloudinary
  // send the updated res to the user
  const avatarLocalPath = req.files?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudianary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(500, "Error while uploading the avatar file");
  }

  await deleteFromCloudianary(req.user.avatar);

  const user = User.findOneAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(200, user, "Avatar successfully updated");
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  // get the avatar from local storage using req.files?.avatar[0]?.path -> ye ek se jyada ke liye
  //upload the avatar from cloudinary
  // check the avatar is uploaded or not
  // update the database
  // delete from cloudinary
  // send the updated res to the user
  const coverImageLocalPath = req.files?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage is required");
  }

  const coverImage = await uploadOnCloudianary(avatarLocalPath);

  if (!coverImage.url) {
    throw new ApiError(500, "Error while uploading the cover image file");
  }

  await deleteFromCloudianary(req.user.avatar);

  const user = User.findOneAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(200, user, "cover image successfully updated");
});

const deleteUser = asyncHandler(async (req, res) => {
  const { password } = req.body;

  const isPasswordValid = req?.user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "delettion of user incomplete Invalid password");
  }

  await deleteFromCloudianary(req?.user?.avatar);
  await deleteFromCloudianary(req?.user?.converImage);
  const user = await User.findByIdAndDelete(req?.user?._id);

  res.status(200).json(new ApiResponce(200, user, "User deleted successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }
  // aggregation pipeline
  const channel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() },
    },
    {
      $lookup: {
        from: "Subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "Subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers", //$ because it is field
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subcribers.subscriber"],
            },
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        coverImage: 1,
        avatar: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponce(200, channel[0], "User Channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId.createFromHexString(req.user._id),
      },
    },
    {
      $lookup: {
        from: "Video",
        localField: "wathchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "User",
              localField: "owner",
              foreignField: "_id",
              as: "owner",

              pipeline: [
                {
                  fullname: 1,
                  username: 1,
                  avatar: 1,
                },
              ],
            },
          },
          {
            $add: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponce(
        200,
        user[0].WatchHistory,
        "watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateDetails,
  updateDetails,
  updateUserAvatar,
  updateUserCoverImage,
  deleteUser,
  getUserChannelProfile,
  getWatchHistory,
};
