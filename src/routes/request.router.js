import { Router } from "express";
import {userRequest , getRequestStatus} from "../controllers/request.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js"


const router = Router();

router.route("/blood-request").post(verifyJWT,userRequest); 
router.route("/requestStatus").post(verifyJWT,getRequestStatus);   


export default router;
