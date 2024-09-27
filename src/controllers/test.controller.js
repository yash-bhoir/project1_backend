import {sendEmailController} from "./email.controller.js"
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import QRCode from "qrcode";

async function generateQRCodeFromJSON(req, res) {
  try {
    const { requestId, userId } = req.body;

    if (!requestId || !userId || typeof requestId !== "string" || typeof userId !== "string") {
      return res.status(400).json({ error: "Invalid input: 'requestId' and 'userId' are required." });
    }

    const qrCodeData = JSON.stringify({ requestId, userId });

    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData);

    if(!qrCodeDataUrl){
        throw new ApiError(505, 'Error while creating Qr code');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if(!user)
        {
            throw new ApiError(505, 'User Not Found');
        }

    const sendTo = user.email;
    const sendSubject = "Request Accepted";



    const sendmailStatus = await sendEmailController( sendTo, subject, htmlContent)

    // res.json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: "Error generating QR code" });
  }
}

export { generateQRCodeFromJSON };
