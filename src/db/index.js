import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

import express from "express";
const app = express();
const connectDB = async () => {
  try {
    const connectionIntance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`\n MongoDB conneted !! DB Host: ${connectionIntance.connection.host}`)
  } catch (error) {
    console.log(`mongodb is my best friend ${process.env.MONGODB_URI}/${DB_NAME}`, error);
    process.exit(1);
  }
};

export default connectDB
