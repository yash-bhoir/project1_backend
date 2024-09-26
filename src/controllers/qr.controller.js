import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import prisma from "../../prisma/index.js";
import QRCode from "qrcode";
import { sendEmail } from "../utils/emailService.js";

const generateqrcode = asyncHandler(async (req, res, next) => {
    const { requestId, userId } = req.body;

    // Check for required fields
    if (!requestId || !userId) {
        return next(new ApiError(400, "Both requestId and userId are required"));
    }

    // Fetch user and request
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const request = await prisma.requestBlood.findUnique({
        where: { id: requestId },
    });

    // Check if user exists
    if (!user) {
        return next(new ApiError(404, "User not found"));
    }

    // Check if request exists
    if (!request) {
        return next(new ApiError(404, "Request not found"));
    }

    // Check if the request has already been accepted
    if (request.isAccepted) {
        return next(new ApiError(400, "This blood request has already been accepted."));
    }

    // Generate QR Code
    let qrCodeUrl;
    try {
        qrCodeUrl = await QRCode.toDataURL(userId);
    } catch (qrError) {
        console.error("QR Code generation failed:", qrError);
        return next(new ApiError(500, "Failed to generate QR code"));
    }

    // Save QR code to database
    try {
        await prisma.qRCode.create({
            data: {
                userId: userId,
                requestId: requestId,
                qrCodeUrl: qrCodeUrl,
            },
        });
    } catch (dbError) {
        console.error("Database error while saving QR code:", dbError);
        return next(new ApiError(500, "Failed to save QR code in the database"));
    }

    // Send email notification
    const emailSubject = "Your Blood Request Has Been Accepted";
    const emailMessage = `
        <h3>Dear ${user.name},</h3>
        <p>Your blood request has been accepted. Please find the details below:</p>
        <ul>
            <li><strong>Blood Type:</strong> ${request.bloodTypeId}</li>
            <li><strong>Quantity:</strong> ${request.quantity} units</li>
            <li><strong>Request Date:</strong> ${request.request_date}</li>
            <li><strong>Required By:</strong> ${request.required_by}</li>
            <li><strong>Delivery Address:</strong> ${request.delivery_address}</li>
            <li><strong>Contact Number:</strong> ${request.contact_number}</li>
            <li><strong>Reason for Request:</strong> ${request.reason_for_request}</li>
            <li><strong>Hospital Name:</strong> ${request.hospital_name}</li>
            <li><strong>Urgent:</strong> ${request.urgent ? "Yes" : "No"}</li>
        </ul>
        <p>Please present the attached QR code to the delivery agent for verification:</p>
        <img src="${qrCodeUrl}" alt="QR Code" />
        <p>Best regards,<br>The Blood Bank Team</p>
    `;

    try {
        await sendEmail(user.email, emailSubject, emailMessage);
    } catch (emailError) {
        console.error("Email sending failed:", emailError);
        return next(new ApiError(500, "Request accepted but failed to send email"));
    }

    // Update the request status
    try {
        await prisma.requestBlood.update({
            where: { id: requestId },
            data: {
                isMailSent: true,
                isAccepted: true, // Make sure to set isAccepted to true
                status: "Accepted",
            },
        });
    } catch (updateError) {
        console.error("Failed to update request status:", updateError);
        return next(new ApiError(500, "Failed to update request status after sending email"));
    }

    // Return a successful response
    return res.status(200).json(
        new ApiResponse(200, {
            message: "Request accepted, QR code generated, and email sent successfully.",
        })
    );
});

export { generateqrcode };
