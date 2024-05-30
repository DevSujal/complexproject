import { v2 as cloudianary } from "cloudinary";
export const deleteFromCloudianary = async (resourse) => {
  try {
    if (!resourse) {
      throw new ApiError(400, "No resourse for deletion");
    }

    await cloudianary.uploader.destroy(resourse);
  } catch (error) {
    throw new ApiError(500, error?.message || "resourse deletion incomplete");
  }
};
