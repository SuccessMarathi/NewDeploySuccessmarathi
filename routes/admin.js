import express from "express";
import { isAdmin, isAuth } from "../middlewares/isAuth.js";
import {
  addLectures,
  createCourse,
  deleteCourse,
  deleteLecture,
  getAllStats,
  getAllUser,
  getAllUsers,
  getlecturesByCourseId,
  getallCourses,
  sendMail
  //updateRole,
} from "../controllers/admin.js";
import  {uploadFiles}  from "../middlewares/multer.js";
import multer from 'multer';


const router = express.Router();

router.post("/course/new",uploadFiles, createCourse);
router.get("/getlecturesByCourseId/:courseId",getlecturesByCourseId)
router.get("/getAllCourses", getallCourses);
router.post("/course/:id/lecture",  addLectures);
router.delete("/course/:id", isAuth, isAdmin, deleteCourse);
router.delete("/lecture/:id",  deleteLecture);
router.get("/stats", isAuth, isAdmin, getAllStats);
//router.put("/user/:id", isAuth, updateRole);
router.get("/users", isAuth, isAdmin, getAllUser);
router.get("/admin/users", isAuth, isAdmin, getAllUsers);
router.post("/admin/sendMail", isAuth, isAdmin, sendMail);

export default router;
