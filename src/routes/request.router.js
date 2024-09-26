import { Router } from "express";
import {userRequest} from "../controllers/request.controller.js";
// import verifyJWT from "../middlewares/auth.middleware.js"


const router = Router();

router.route("/blood-request").post(userRequest);   

export default router;
