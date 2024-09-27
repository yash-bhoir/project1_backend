import { Router } from "express";
import {generateQRCodeFromJSON} from "../controllers/test.controller.js";


const router = Router();

router.route("/test").post(generateQRCodeFromJSON);   

export default router;
