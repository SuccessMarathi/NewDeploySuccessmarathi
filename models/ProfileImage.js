import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the User model
    ref: "User",
    required: true,
  },
  profileImage: {
    type: String, // URL from Cloudinary
    required: true,
  },
});

const ProfileImage = mongoose.model("ProfileImage", ImageSchema);

export default ProfileImage;