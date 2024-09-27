import { sendEmailController } from "./email.controller.js";
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js'; 
import QRCode from "qrcode";
import prisma from '../../prisma/index.js';

const generateqrcode = async (requestId, userId) => { 

    if (!requestId || !userId) {
        throw new ApiError(400, 'Both requestId and userId are required.');
    }

    const qrCodeData = JSON.stringify({ requestId, userId });
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData);

    if (!qrCodeDataUrl) {
        throw new ApiError(404, 'Error while creating QR code.');
    }

    console.log("QR URL", qrCodeDataUrl);

    const user = await prisma.user.findFirst({ where: { id: userId } });

    if (!user) {
        throw new ApiError(404, 'User not found.');
    }


    const to = "yash51217@gmail.com";
    // const sendTo = user.email;
    const subject = "Request Accepted";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif;">
            <h1>Request Accepted</h1>
            <p>Dear ${user.username},</p>
            <p>Your request with ID <strong>${requestId}</strong> has been accepted.</p>
            <p>Please find your QR code below:</p>
            <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 200px; height: 200px;"/>
            <p>Thank you!</p>
            <p>Best regards,<br/>Your Company Name</p>
        </div>
    `;

    try {
         const readStatus = await sendEmailController(to, subject, htmlContent);
         console.log ("readStatus::", readStatus)

        return { status: 200, message: "QR code generated and email sent successfully." };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new ApiError(500, "Failed to send email.");
    }
};

export { generateqrcode };
