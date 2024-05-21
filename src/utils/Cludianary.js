import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"
// file upload code in cloudianary
    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDIANARY_CLOUD_NAME, 
        api_key: process.env.CLOUDIANARY_API_KEY, 
        api_secret: process.env.CLOUDIANARY_API_SECERT // Click 'View Credentials' below to copy your API secret
    });

    const uploadOnCloudianary = async (localFilePath) => {
        try {

            if(!localFilePath){
                return null
            }

           const responce = await cloudinary.uploader.upload(localFilePath, {
                resource_type : "auto"
            })

            // file has been uploaded successfully
            console.log("file is uploaded on cloudianary", responce.url)

            return responce
        } catch (error) {
            fs.unlinkSync(localFilePath) // remove the locally saved file as the upload operation got failed
            console.log("file upload failed", error)

            return null
        }
    }
    

export {uploadOnCloudianary}
    