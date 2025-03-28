import  User  from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import TryCatch from "../middlewares/TryCatch.js";
import { v4 as uuidv4 } from "uuid";
import ProfileImage from "../models/ProfileImage.js";
//test
import cloudinary from '../middlewares/cloudinary.js'




export const register = [
  TryCatch(async (req, res) => {
    const { email, name, password, contact } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "User Already exists",
      });
    }

    // Hash the password
    const hashPassword = await bcrypt.hash(password, 10);

    // Generate a Unique 6-Digit Referral ID
    let newReferralId;
    let isUnique = false;

    while (!isUnique) {
      newReferralId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingReferral = await User.findOne({ referralId: newReferralId });
      if (!existingReferral) {
        isUnique = true;
      }
    }

    // Create referral link
    const referralLink = newReferralId;

    // Store profile image (if uploaded)
    const profileImage = req.file ? req.file.path : null;

    // Create new userm
    user = await User.create({
      name,
      email,
      contact,
      password: hashPassword,
      referralId: newReferralId, // Save referral ID in DB
      referralLink, 
      profileImage, 
      earnings: 0,
    });

    // Generate activation token (expires in 5 minutes)
    const activationToken = jwt.sign(
      { user: { id: user._id, email: user.email } },
      "abcd",
      { expiresIn: "5m" }
    );

    // Send response
    res.status(200).json({
      message: "User created!",
      activationToken,
      referralLink: user.referralLink,
      profileImage: user.profileImage,
    });
  }),
];


// export const register = TryCatch(async (req, res) => {
//   const { email, name, password, contact } = req.body;

//   // Check if user already exists
//   let user = await User.findOne({ email });

//   if (user)
//     return res.status(400).json({
//       message: "User Already exists",
//     });

//   // Hash the password
//   const hashPassword = await bcrypt.hash(password, 10);

//   // Generate a unique referral ID
//   const referralLink = uuidv4();

//   // Create the user
//   user = await User.create({
//     name,
//     email,
//     contact,
//     password: hashPassword,
//     referralLink, // Add the generated referral link
//     earnings: 0,  // Initialize earnings to 0
//   });

//   // Generate activation token
//   const activationToken = jwt.sign(
//     { user: { id: user._id, email: user.email } },
//     process.env.Activation_Secret,
//     { expiresIn: "5m" }
//   );

//   // Send response
//   res.status(200).json({
//     message: "User created!",
//     activationToken,
//     referralLink: user.referralLink, // Optional: return referral link in the response
//   });
// });




// export const loginUser = TryCatch(async (req, res) => {
//   const { email, password } = req.body;

//   const user = await User.findOne({ email });

//   if (!user)
//     return res.status(400).json({
//       message: "No User with this email",
//     });

//   const mathPassword = await bcrypt.compare(password, user.password);

//   if (!mathPassword)
//     return res.status(400).json({
//       message: "wrong Password",
//     });

//   const token = jwt.sign({ _id: user._id }, process.env.Jwt_Sec, {
//     expiresIn: "15d",
//   });

//   res.json({
//     message: `Welcome back ${user.name}`,
//     token,
//     user,
//   });
// });

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

  const user = await User.findOne({ email });

  if (!user)
    return res.status(404).json({
      message: "No User with this email",
    });

  const token = jwt.sign({ email }, process.env.Forgot_Secret);

  const data = { email, token };

  await sendForgotMail("E learning", data);

  user.resetPasswordExpire = Date.now() + 5 * 60 * 1000;

  await user.save();

  res.json({
    message: "Reset Password Link is send to you mail",
  });
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




//Fetch my affiliates
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




export const deleteUserByEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Delete the user
    await User.deleteOne({ email });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Server error, unable to delete user",
    });
  }
};
