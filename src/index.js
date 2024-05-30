// require('dotenv').config({path: './env'})
// import dotenv from "dotenv"
import "dotenv/config";
import { app } from "./app.js";
import connectDB from './db/index.js';
// dotenv.config({
//     path: './env'
//  }) // package.json me script me dev me hame ye likhna padega nodemon -r dotenv/config --experimental-json-module src/index.js agar ye use karna hai to
connectDB().then(() => {
    app.on("error", (err) => {
      console.log("error occured !");
      throw err;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log("server is running at ", process.env.PORT);
    });
  })
  .catch((err) => {
    console.log(err, "mongodb connection failed");
  });

/*
import express from "express"
const app = express()
;(async () => {
    try{
      await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      app.on("error", (err) => {
        console.log("error", err)
        throw err
      })
      app.listen(process.env.PORT, ()=> {
        console.log("server is running on port", process.env.PORT)
      })
    }catch(error){
        console.log(error)
    }
})() // iffi
*/
