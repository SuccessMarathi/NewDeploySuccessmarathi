import  User  from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import TryCatch from "../middlewares/TryCatch.js";
import { v4 as uuidv4 } from "uuid";
import sendForgotMail from '../middlewares/sendMail.js'


import multer from "multer";
import path from "path";

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/images/"); // Directory to store images
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Configure Multer
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const fileTypes = /jpeg|jpg|png/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed!"));
    }
  },
});


export const register = [
  upload.single("profileImage"), // Middleware to handle image upload
  TryCatch(async (req, res) => {
    const { email, name, password, contact } = req.body;

    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "User Already exists",
      });
    }

   
    const hashPassword = await bcrypt.hash(password, 10);

    const referralLink = uuidv4();
    const profileImage = req.file ? req.file.path : null;

   
    user = await User.create({
      name,
      email,
      contact,
      password: hashPassword,
      referralLink, 
      profileImage, 
      earnings: 0, 
    });

   
    const activationToken = jwt.sign(
      { user: { id: user._id, email: user.email } },
      "abcd",
      { expiresIn: "5m" }
    );

   
    res.status(200).json({
      message: "User created!",
      activationToken,
      referralLink: user.referralLink, 
      profileImage: user.profileImage, 
    });
  }),
];



export const loginUser = TryCatch(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

 
  
  if (!user)
    return res.status(400).json({
      message: "No User with this email",
    });

  const mathPassword = await bcrypt.compare(password, user.password);

 
  
  if (!mathPassword)
    return res.status(400).json({
      message: "wrong Password",
    });

   

  const token = jwt.sign({ _id: user._id }, "abcd", {
    expiresIn: "15d",
  });


  res.json({
    message: `Welcome back ${user.name}`,
    token,
    user,
  });

 

});

export const myProfile = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ user });
});

export const forgotPassword = TryCatch(async (req, res) => {
  const { email } = req.body;

  console.log("1");
  
  // Check if the email exists in the database
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      message: "No user found with this email",
    });
  }
  console.log("2");


  // Generate a secure token
  const token = jwt.sign({ email }, "abcd", { expiresIn: "5m" }); // 5 minutes expiry
 
  console.log("3",token);


  // Prepare data for the email
  const data = {
    email,
    token,
    resetLink: `http://your-frontend-url.com/reset-password?token=${token}`, // Add frontend reset link
  };

  console.log("4",data);

  // Send the reset password email
  await sendForgotMail("E-learning Password Reset", data);

  console.log("5");

  // Update user with token expiration time
  user.resetPasswordExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
  await user.save();
  
  console.log("5");

  res.status(200).json({
    message: "Reset password link has been sent to your email",
  });

  console.log("6");

});


export const resetPassword = TryCatch(async (req, res) => {
  const decodedData = jwt.verify(req.query.token, process.env.Forgot_Secret);

  const user = await User.findOne({ email: decodedData.email });

  if (!user)
    return res.status(404).json({
      message: "No user with this email",
    });

  if (user.resetPasswordExpire === null)
    return res.status(400).json({
      message: "Token Expired",
    });

  if (user.resetPasswordExpire < Date.now()) {
    return res.status(400).json({
      message: "Token Expired",
    });
  }

  const password = await bcrypt.hash(req.body.password, 10);

  user.password = password;

  user.resetPasswordExpire = null;

  await user.save();

  res.json({ message: "Password Reset" });
});


export const getAffiliates = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming `req.user` contains authenticated user info

    const affiliates = await User.find({ referrer: userId }).select(
      "name contact purchasedCourses"
    );

    res.status(200).json({
      success: true,
      affiliates,
    });
  } catch (error) {
    console.error("Error fetching affiliates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch affiliates",
    });
  }
};


//controller to fetch the top 10 users with highest earnings


export const getLeaderboard = async (req, res) => {
  try {
    // Fetch the top 10 users sorted by earnings.total in descending order
    const leaderboard = await User.find({})
      .sort({ "earnings.total": -1 })
      .limit(10)
      .select("name earnings.total"); // Select only necessary fields

    // Fetch profile images for each user
    const leaderboardWithImages = await Promise.all(
      leaderboard.map(async (user) => {
        const profileImage = await ProfileImage.findOne({ userID: user._id });

        return {
          _id: user._id,
          name: user.name,
          totalEarnings: user.earnings.total,
          profileImage: profileImage ? profileImage.profileImage : null, // Include image if available
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Leaderboard fetched successfully",
      leaderboard: leaderboardWithImages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching leaderboard",
      error: error.message,
    });
  }
};


export const getUserProfileImage = async (req, res) => {
  try {
    const userID = req.user._id; // Extract user ID from the authenticated request

    // Find the profile image associated with the user
    const profileImage = await ProfileImage.findOne({ userID });

    if (!profileImage) {
      return res.status(404).json({
        message: "Profile image not found for this user.",
      });
    }

    res.status(200).json({
      message: "Profile image fetched successfully.",
      profileImage: profileImage.profileImage, // Return the image URL
    });
  } catch (error) {
    console.error("Error fetching profile image:", error);
    res.status(500).json({
      message: "An error occurred while fetching the profile image.",
      error: error.message,
    });
  }
};
