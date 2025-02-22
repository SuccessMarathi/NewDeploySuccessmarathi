import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: null, // Store the image path or URL
  },
  role: {
    type: String,
    required: true,
    default: "user", // Default value is "user"
  },
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  referralLink: {
    type: String,
    unique: true,
    default: null, // Generated when the user purchases a course
  },
  referrer: {
    type: mongoose.Schema.Types.ObjectId, // Linking to another user (referrer)
    ref: "User",
    default: null,
  },
  contact: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v); // Regex to validate 10-digit numbers
      },
      message: (props) => `${props.value} is not a valid 10-digit phone number!`,
    },
  },
  earnings: {
    total: { type: Number, default: 0 }, // Lifetime total earnings
    today: { type: Number, default: 0 }, // Earnings today
    week: { type: Number, default: 0 }, // Earnings this week
    month: { type: Number, default: 0 }, // Earnings this month
    lastUpdated: { type: Date, default: new Date() }, // Last update for earnings
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set  the creation date
  },
});

const User = mongoose.model("User", userSchema);

export default User;
