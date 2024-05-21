import mongoose, { Schema } from "mongoose";
import mongooseAggregate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
  {
    video : {
      type: String, // clodianary url
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String, // cloudianary ka url ham save karenge
      required: true,
    },
    duration: {
      type: Number, // cloudanary se hi milega
      required : true
    },
    views: {
        type : Number,
        default : 0
    },
    ispublished: {
      type: Boolean
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref : "User"
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregate)

export const Video = mongoose.model("Video", videoSchema);
