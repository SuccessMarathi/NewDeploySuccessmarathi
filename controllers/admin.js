import TryCatch from "../middlewares/TryCatch.js";
import  Courses  from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { rm } from "fs";
import { promisify } from "util";
import fs from "fs";
import  User  from "../models/User.js"; 
import multer from 'multer';
import PendingOrder from "../models/PendingOrder.js";
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";


export const createCourse = TryCatch(async (req, res) => {
  console.log("Received Request Body:", req.body);
  console.log("Received File:", req.file); // Debugging file upload

  const { name, price, description } = req.body;
  const image = req.file ? req.file.path : null; // Store only the image path

  // Check if any required field is missing
  if (!name || !price || !description || !image) {
    return res.status(400).json({
      message: "Please provide all required fields: name, price, description, and image.",
    });
  }

  // Create a new course with image path
  const course = await Courses.create({ 
    name, 
    price, 
    description, 
    image 
  });

  res.status(201).json({
    message: "Course created successfully!",
    course
  });
});

export const addLectures = TryCatch(async (req, res) => {
  console.log("Received Request Body:", req.body);

  // Find the course
  const course = await Courses.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      message: "No Course with this ID found.",
    });
  }

  const {  video } = req.body;

  if (!video) {
    return res.status(400).json({
      message: "Please provide all required fields:  video link.",
    });
  }

  // Create a new lecture with video link
  const lecture = await Lecture.create({
    video, // Store the video URL instead of a file path
    course: course._id,
  });

  // Add the lecture to the course
  course.lectures.push(lecture._id);
  await course.save(); // Save the updated course

  res.status(201).json({
    message: "Lecture Added Successfully!",
    lecture,
    course,
  });
});

export const getlecturesByCourseId = TryCatch(async (req, res) => {
  const { courseId } = req.params;

  // Fetch lectures that match the provided courseId
  const lectures = await Lecture.find({ course: courseId });

  console.log(lectures); // Debugging

  if (!lectures.length) {
    return res.status(404).json({ message: "No lectures found for this course." });
  }

  res.status(200).json({
    message: "Lectures fetched successfully!",
    lectures,
  });
});

export const getallCourses = TryCatch(async (req, res) => {

  const course = await Courses.find();

  console.log(course); // Debugging

  if (!course.length) {
    return res.status(404).json({ message: "No courses found " });
  }

  res.status(200).json({
    message: "All coures fetch successfully!",
    course,
  });
});




export const deleteLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);

  if (!lecture) {
    return res.status(404).json({ message: "Lecture not found" });
  }

  rm(lecture.video, () => {
    console.log("Video deleted");
  });

  await lecture.deleteOne();

  res.json({ message: "Lecture Deleted" });
});


const unlinkAsync = promisify(fs.unlink);

export const deleteCourse = async (req, res) => {
  try {
    const course = await Courses.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Find all lectures related to this course
    const lectures = await Lecture.find({ course: course._id });

    // Delete video files only if they are valid local file paths
    await Promise.all(
      lectures.map(async (lecture) => {
        if (lecture.video && !lecture.video.startsWith("http")) {
          if (fs.existsSync(lecture.video)) {
            await unlinkAsync(lecture.video);
            console.log("Video deleted:", lecture.video);
          }
        }
      })
    );

    // Delete the course image if it exists
    if (course.image && fs.existsSync(course.image)) {
      await unlinkAsync(course.image);
      console.log("Image deleted:", course.image);
    }

    // Delete all lectures linked to the course
    await Lecture.deleteMany({ course: req.params.id });

    // Delete the course itself
    await course.deleteOne();

    // Remove course from all users' subscriptions
    await User.updateMany({}, { $pull: { subscription: req.params.id } });

    res.json({ message: "Course Deleted",
      course
     });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const getAllStats = TryCatch(async (req, res) => {
  const totalCoures = (await Courses.find()).length;
  const totalLectures = (await Lecture.find()).length;
  const totalUsers = (await User.find()).length;

  const stats = {
    totalCoures,
    totalLectures,
    totalUsers,
  };

  res.json({
    stats,
  });
});

export const getAllUser = TryCatch(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).select(
    "-password"
  );

  res.json({ users });
});

export const updateRole = TryCatch(async (req, res) => {
  if (req.user.mainrole !== "superadmin")
    return res.status(403).json({
      message: "This endpoint is assign to superadmin",
    });
  const user = await User.findById(req.params.id);

  if (user.role === "user") {
    user.role = "admin";
    await user.save();

    return res.status(200).json({
      message: "Role updated to admin",
    });
  }

  if (user.role === "admin") {
    user.role = "user";
    await user.save();

    return res.status(200).json({
      message: "Role updated",
    });
  }
});

export const getAllUsers = async (req, res) => {
  try {
    // Fetch all users, selecting only the required fields
    const users = await User.find({}, "name contact earnings.total").sort({ name: 1 }); // Select earnings.total only

    // Add numbering and map fields for the response
    const numberedUsers = users.map((user, index) => ({
      number: index + 1,
      name: user.name,
      contact: user.contact,
      earnings: user.earnings.total, // Use earnings.total
    }));

    res.status(200).json({
      success: true,
      users: numberedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
};


export const courselectures = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if the course exists
    const course = await Courses.findById(id);
    if (!course) {
      return res.status(404).json({
        message: "No Course with this id",
      });
    }

    // Find lectures associated with the course
    const lectures = await Lecture.find({ course: courseId });

    res.status(200).json({
      message: "Lectures fetched successfully",
      lectures,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching lectures",
      error: error.message,
    });
  }
};




import nodemailer from "nodemailer";



export const sendMail = TryCatch(async (req, res) => {
  const { email, amount } = req.body;

  if (!email || !amount) {
    return res.status(400).json({ message: "Email and amount are required." });
  }

  // Get the current date in DD-MM-YYYY format
  const date = new Date().toLocaleDateString("en-IN");

  // Nodemailer transporter setup with SMTP
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // Use 587 for TLS
    secure: true, // true for 465 (SSL), false for 587 (TLS)
    auth: {
      user: "successmarathi4january@gmail.com",
      pass: "cjcvnnepprcwwxhe", // Replace with App Password if needed
    },
  });

  // HTML email content with inline CSS
  const mailOptions = {
    from: "successmarathi4january@gmail.com",
    to: email,
    subject: "Payment Confirmation - SuccessMarathi",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #2c3e50; text-align: center;">🎉 Congratulations, ${email}! 🎉</h2>
        <p style="font-size: 18px; color: #333;">Your earnings have been transferred from <strong>SuccessMarathi</strong>!</p>
        
        <div style="text-align: center; padding: 15px; background-color: #dff0d8; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #3c763d;">💰 You Have Earned</h3>
          <p style="font-size: 22px; font-weight: bold; color: #3c763d;">₹${amount}</p>
        </div>

        <p style="font-size: 16px; color: #555;">We are happy to inform you that we have transferred the payment into your bank account.</p>
        <p style="text-align: right; font-size: 14px; color: #777;">📅 Date: <strong>${date}</strong></p>

        <div style="margin-top: 20px; text-align: center;">
          <p style="font-size: 16px; color: #222;"><strong>Founder,</strong></p>
          <p style="font-size: 18px; font-weight: bold; color: #222;">Akash Rathod</p>
        </div>
      </div>
    `,
  };

  // Send the email with error logging
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({
        message: "Failed to send email.",
        error: error.message, // Send the exact error to frontend
      });
    } else {
      console.log("Email sent successfully!");
      
      return res.status(200).json({
        message: "Email sent successfully!",
      
      });
    }
  });
});






// GET /api/admin/pending-orders
export const getPendingOrders = async (req, res) => {
  try {
    console.log("🔍 Inside getPendingOrders");
    console.log("👤 User:", req.user);

    const pendingOrders = await PendingOrder.find({})
      .populate("user")
      .populate("course")
      .populate("referrer");

    return res.status(200).json({ orders: pendingOrders });
  } catch (err) {
    console.error("❌ Error inside getPendingOrders:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};




// Helper to update earnings
const updateEarnings = (user, amount) => {
  const now = new Date();
  const today = now.toDateString(); // e.g., "Tue Jan 02 2025"

  // Reset earnings if the day, week, or month has changed
  const isNewDay = today !== new Date(user.earnings.lastUpdated).toDateString();
  const isNewWeek = now.getWeek() !== new Date(user.earnings.lastUpdated).getWeek();
  const isNewMonth = now.getMonth() !== new Date(user.earnings.lastUpdated).getMonth();

  if (isNewDay) user.earnings.today = 0;
  if (isNewWeek) user.earnings.week = 0;
  if (isNewMonth) user.earnings.month = 0;

  // Update earnings
  user.earnings.today += amount;
  user.earnings.week += amount;
  user.earnings.month += amount;
  user.earnings.total += amount;
  user.earnings.lastUpdated = now;
};

Date.prototype.getWeek = function () {
  const oneJan = new Date(this.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((this - oneJan) / (24 * 60 * 60 * 1000));
  return Math.ceil((this.getDay() + 1 + numberOfDays) / 7);
};


export const handlePendingOrder = TryCatch(async (req, res) => {
  const { orderId, action } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  const order = await PendingOrder.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const course = await Courses.findById(order.course);
  const user = await User.findById(order.user);

  if (!course || !user) {
    return res.status(404).json({ message: "User or Course not found" });
  }

  const earningsMapping = {
    "67b81fdeb7e36f5e02b649cd": { referrer: 160, grandReferrer: 1 },
    "67b82012b7e36f5e02b649cf": { referrer: 280, grandReferrer: 40 },
    "67b82046b7e36f5e02b649d1": { referrer: 490, grandReferrer: 70 },
    "67b8206eb7e36f5e02b649d3": { referrer: 700, grandReferrer: 100 },
    "67b82092b7e36f5e02b649d5": { referrer: 1605, grandReferrer: 220 },
    "67b820b1b7e36f5e02b649d7": { referrer: 3650, grandReferrer: 399 },
  };

  if (action === "approve") {
    const courseObjectId = new mongoose.Types.ObjectId(order.course);
    const earnings = earningsMapping[order.course.toString()] || {
      referrer: 0,
      grandReferrer: 0,
    };

    const alreadyPurchased = user.purchasedCourses.some((c) =>
      c.equals(courseObjectId)
    );

    if (!alreadyPurchased) {
      user.purchasedCourses.push(courseObjectId);

      // 🟡 Handle referral and grand referral earnings safely
      if (order.referrer) {
        const referrer = await User.findById(order.referrer);
        if (referrer) {
          updateEarnings(referrer, earnings.referrer);
          await referrer.save();

          user.referrer = referrer._id;

          if (referrer.referrer) {
            const grandReferrer = await User.findById(referrer.referrer);
            if (grandReferrer) {
              updateEarnings(grandReferrer, earnings.grandReferrer);
              await grandReferrer.save();
            }
          }
        }
      }

      await user.save();

      await Transaction.create({
        user: user._id,
        userName: user.name,
        contact: user.contact,
        courseId: course._id,
        courseName: course.name,
        paymentId: order.transactionId,
        status: "Success",
        timestamp: new Date(),
      });

      await order.deleteOne();

      return res.status(200).json({
        message: "Order approved and course added",
      });
    } else {
      return res
        .status(400)
        .json({ message: "User already owns the course" });
    }
  } else if (action === "reject") {
    await order.deleteOne();
    return res.status(200).json({ message: "Order rejected and removed" });
  } else {
    return res.status(400).json({ message: "Invalid action type" });
  }
});