import { Router } from "express";
import { registerUser ,loginUser,logoutUser, generateAccessAndRefreshTokens , refreshAccessToken, getUserFormStatus} from "../controllers/user.controller.js";
// import {upload} from "../middlewares/multer.middleware.js"
import verifyJWT from "../middlewares/auth.middleware.js"


const router = Router();

router.route("/register").post(registerUser);   
router.route("/login").post(loginUser);
router.route("/refresh-token").post(generateAccessAndRefreshTokens);

// //secure route
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refreshAccessToken").post(verifyJWT, refreshAccessToken);
router.route("/user-status").post(verifyJWT,getUserFormStatus);




export default router;
