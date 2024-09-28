import { Router } from "express";
import {  addUserInfo, updateUserInfo, getUserInfoByUserId } from "../controllers/UserInfo.controller.js";
// import {upload} from "../middlewares/multer.middleware.js"
import verifyJWT from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/user-info").post(verifyJWT,addUserInfo);

// router.route("/form-check").post(checkFormFilled);

router.route("/user-info/edit").post(verifyJWT,updateUserInfo);

router.route("/user-info/:userId").get(verifyJWT,getUserInfoByUserId); 

export default router;
