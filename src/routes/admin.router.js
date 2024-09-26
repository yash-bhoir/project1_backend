import { Router } from "express";
import { acceptRequest} from "../controllers/admin.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js"


const router = Router();

router.route("/acceptRequest").post(acceptRequest);   


export default router;
