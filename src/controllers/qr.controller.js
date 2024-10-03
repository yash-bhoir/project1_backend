import { sendEmailController } from "./email.controller.js";
import { ApiError } from '../utils/ApiError.js';
import QRCode from "qrcode";
import prisma from '../../prisma/index.js';
import { asyncHandler } from "../utils/asyncHandler.js";

const generateqrcode = async (requestId, userId) => { 
    if (!requestId || !userId) {
        throw new ApiError(400, 'Both requestId and userId are required.');
    }

    // Generate QR code Buffer
    const qrCodeData = JSON.stringify({ requestId, userId });
    let qrCodeBuffer;

    try {
        qrCodeBuffer = await QRCode.toBuffer(qrCodeData, { errorCorrectionLevel: 'H' });
    } catch (error) {
        throw new ApiError(500, 'Error while generating QR code.');
    }

    // Fetch user details from the database
    const user = await prisma.user.findFirst({ where: { id: userId } });
    if (!user) {
        throw new ApiError(404, 'User not found.');
    }

    const to = user.email;
    // const to = 'yash51217@gmail.com'; 
    const subject = "Request Accepted";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h1 style="color: #4CAF50;">Request Accepted</h1>
            <p>Dear ${user.username},</p>
            <p>Your request with ID <strong>${requestId}</strong> has been accepted.</p>
            <p>Please find your QR code below:</p>
            <div style="text-align: center;">
                <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #ccc; border-radius: 4px;"/>
            </div>
            <p>If you have any questions, feel free to reach out to us.</p>
            <p>Thank you!</p>
            <p>Best regards,<br/>Your Company Name</p>
        </div>
    `;

    try {
        const readStatus = await sendEmailController(to, subject, htmlContent, qrCodeBuffer);

        if(!readStatus.status===200){
            throw new ApiError(500, "Failed to send email.");
        }

        await prisma.requestBlood.update({
            where: { id: requestId },
            data: { isMailSent: true , isAproved: false },
        });

        return { status: 200, message: "QR code generated and email sent successfully." };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new ApiError(500, "Failed to send email.");
    }
};


  


export { generateqrcode };
