import { Router } from "express";
import { acceptRequest,checkQrAuth} from "../controllers/admin.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js"


const router = Router();

router.route("/acceptRequest").post(verifyJWT,acceptRequest);   
router.route("/aproveUser").post(verifyJWT,checkQrAuth);   



export default router;
