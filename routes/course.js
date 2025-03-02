import express from "express";
import {
  getAllCourses,
  getSingleCourse,
  fetchLectures,
  // fetchLecture,
  fetchLectureBYCourseId,
  getMyCourses,
  verifyPayment,
getCourseDetails
 // checkout,
 // paymentVerification,
} from "../controllers/course.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.get("/course/all", getAllCourses);
router.get("/course/:id", getSingleCourse);
router.get("/lectures/:id", isAuth, fetchLectures);
router.get("/lectures/:courseId", isAuth,fetchLectureBYCourseId);
router.get("/mycourse", isAuth, getMyCourses);


router.post("/course/purchase",isAuth, verifyPayment);
router.get('/course/:id', getCourseDetails);
//router.post("/course/checkout/:id", isAuth, checkout);
//router.post("/verification/:id", isAuth, paymentVerification);

export default router;
