import TryCatch from "../middlewares/TryCatch.js";
import  Courses  from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { rm } from "fs";
import { promisify } from "util";
import fs from "fs";
import  User  from "../models/User.js"; 
import multer from 'multer';


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


