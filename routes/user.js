import express from "express";
import User from "../models/User.js";
import {
  forgotPassword,
  loginUser,
  myProfile,
  register,
  resetPassword,
} from "../controllers/user.js";
import { isAuth } from "../middlewares/isAuth.js";
//import { addProgress, getYourProgress } from "../controllers/course.js";

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



//try this for my account page
router.get("/user/referrer/:id", isAuth, async (req, res) => {
  try {
    const { id } = req.params;                                                                                                                                                              

    const user = await User.findById(id);
    if (!user) return res.status(404).send({ message: "User not found" });

    console.log(user);
    console.log('1');
    
    if (!user.referrer) {
      return res.status(200).send({
        referrer: {
          name: "Not applicable",
          email: "Not applicable",
          contact: "Not applicable",
        },
      });
    }

    console.log("2");
    

    const referrer = await User.findById(user.referrer);
    if (!referrer) return res.status(404).send({ message: "Referrer not found" });

    res.status(200).send({
      referrer: {
        name: referrer.name,
        email: referrer.email,
        contact: referrer.contact || "N/A",
      },
    });
    console.log("3");
    
  }
  
  catch (error) {
    console.error("Error fetching referrer:", error);
    res.status(500).send({ message: "Server error" });
  }
});



export default router;
