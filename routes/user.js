import express from "express";
import User from "../models/User.js";
import {
  forgotPassword,
  getAffiliates,
  getLeaderboard,
  getUserProfileImage,
  loginUser,
  myProfile,
  register,
  resetPassword,
  deleteUser
} from "../controllers/user.js" ;
import { isAuth } from "../middlewares/isAuth.js";
//import { addProgress, getYourProgress } from "../controllers/course.js";


import ProfileImage from '../models/ProfileImage.js';

import multer from "multer";

import mongoose from "mongoose";

import cloudinary from 'cloudinary';

import dotenv from 'dotenv';

const router = express.Router();

router.post("/user/register", register);
router.post("/user/login", loginUser);
router.get("/user/me", isAuth, myProfile);
router.post("/user/forgot", forgotPassword);
router.post("/user/reset", resetPassword);
//router.post("/user/progress", isAuth, addProgress);
//router.get("/user/progress", isAuth, getYourProgress);

router.get("/user/my-affiliates", isAuth, getAffiliates);
router.get("/leaderboard", isAuth, getLeaderboard);

//route for Profile Image
router.get("/profile-image", isAuth, getUserProfileImage);
router.delete("/users/:id", deleteUser);



//try this for my account page
// router.get("/user/referrer/:id", isAuth, async (req, res) => {
//   try {
//     const { id } = req.params;                                                                                                                                                              

//     const user = await User.findById(id);
//     if (!user) return res.status(404).send({ message: "User not found" });

//     console.log(user);
//     console.log('1');
    
//     if (!user.referrer) {
//       return res.status(200).send({
//         referrer: {
//           name: "Not applicable",
//           email: "Not applicable",
//           contact: "Not applicable",
//         },
//       });
//     }

//     console.log("2");
    

//     const referrer = await User.findById(user.referrer);
//     if (!referrer) return res.status(404).send({ message: "Referrer not found" });

//     res.status(200).send({
//       referrer: {
//         name: referrer.name,
//         email: referrer.email,
//         contact: referrer.contact || "N/A",
//       },
//     });
//     console.log("3");
    
//   }
  
//   catch (error) {
//     console.error("Error fetching referrer:", error);
//     res.status(500).send({ message: "Server error" });
//   }
// });


router.get("/user/referrer/:id", isAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).send({ message: "User not found" });

    if (!user.referrer) {
      return res.status(200).send({
        referrer: {
          name: "Not applicable",
          email: "Not applicable",
          contact: "Not applicable",
        },
      });
    }

    const referrer = await User.findById(user.referrer);
    if (!referrer) return res.status(404).send({ message: "Referrer not found" });

    res.status(200).send({
      referrer: {
        name: referrer.name,
        email: referrer.email,
        contact: referrer.contact || "N/A",
      },
    });
  } catch (error) {
    console.error("Error fetching referrer:", error);
    res.status(500).send({ message: "Server error" });
  }
});





import fs from 'fs'
import path from "path";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = '../uploads';

//     // Check if the directory exists, if not, create it
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true }); // create the directory
//     }

//     cb(null, uploadDir); // Set the destination to the uploads folder
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + file.originalname); // Set the unique filename
//   }
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'image/jpeg' || 
//       file.mimetype === 'image/jpg' || 
//       file.mimetype === 'image/png') {
//       cb(null, true);
//   } else {
//       cb(null, false);
//   }
// };

// // Set the upload settings
// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 1024 * 1024 * 5 // 5MB
//   },
//   fileFilter: fileFilter
// });

// // Your route to handle the file upload
// router.post("/image", upload.single('profileImage'), (req, res, next) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No file uploaded' });
//   }

//   const profileImage = new ProfileImage({
//     _id: new mongoose.Types.ObjectId(),
//     profileImage: req.file.path
//   });

//   profileImage.save()
//     .then(result => {
//       res.status(201).json({
//         message: 'Image uploaded successfully',
//         newImage: result
//       });
//     })
//     .catch(err => {
//       console.error(err);
//       res.status(500).json({
//         error: err.message
//       });
//     });
// });


dotenv.config();


cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for temporary file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads'; // Temporary folder for uploads

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir); // Save to uploads folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || 
      file.mimetype === 'image/jpg' || 
      file.mimetype === 'image/png') {
      cb(null, true);
  } else {
      cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Max file size 5MB
  fileFilter: fileFilter,
});

// Route to handle image upload
router.post("/image", isAuth, upload.single("profileImage"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const userID = req.user._id; // Extract the user ID from the isAuth middleware

    // Upload image to Cloudinary
    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: "profile_images",
    });

    // Delete the temporary file after upload
    fs.unlinkSync(req.file.path);

    // Check if a ProfileImage document exists for this user
    const existingImage = await ProfileImage.findOne({ userID });

    if (existingImage) {
      // Update the existing profile image
      existingImage.profileImage = result.secure_url;
      const updatedImage = await existingImage.save();

      return res.status(200).json({
        message: "Profile image updated successfully",
        imageUrl: result.secure_url,
        updatedImage,
      });
    } else {
      // Create a new profile image document
      const profileImage = new ProfileImage({
        userID,
        profileImage: result.secure_url,
      });

      const savedImage = await profileImage.save();

      return res.status(201).json({
        message: "Profile image uploaded successfully",
        imageUrl: result.secure_url,
        savedImage,
      });
    }
  } catch (error) {
    console.error(error);

    // Delete temporary file in case of an error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: error.message,
    });
  }
});




export default router;
