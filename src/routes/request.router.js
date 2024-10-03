import { Router } from "express";
import {userRequest , getRequestStatus, getAllRequest} from "../controllers/request.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js"


const router = Router();

router.route("/blood-request").post(verifyJWT,userRequest); 
router.route("/requestStatus").post(verifyJWT,getRequestStatus);  
router.route("/getAllRequest").post(verifyJWT,getAllRequest);   



export default router;
