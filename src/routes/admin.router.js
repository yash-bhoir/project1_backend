import { Router } from "express";
import { acceptRequest,checkQrAuth,getAllUser,changeRole} from "../controllers/admin.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js"


const router = Router();

router.route("/acceptRequest").post(verifyJWT,acceptRequest);   
router.route("/aproveUser").post(verifyJWT,checkQrAuth);   
router.route("/getAllUser").post(verifyJWT,getAllUser); 
router.route("/changeRole").post(verifyJWT,changeRole);   



export default router;
