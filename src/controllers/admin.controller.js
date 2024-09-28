import { ApiError } from '../utils/ApiError.js';
import prisma from '../../prisma/index.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateqrcode } from '../controllers/qr.controller.js'; 
import { asyncHandler } from '../utils/asyncHandler.js'; 

const acceptRequest = asyncHandler(async (req, res) => { 
    const { userId, requestId, isAccepted } = req.body;

    if (!userId || !requestId) {
        throw new ApiError(400, 'Both requestId and userId fields are required.');
    }

    const request = await prisma.requestBlood.findFirst({
        where: { id: requestId },
    });

    if (!request) {
        throw new ApiError(404, 'Blood request not found.');
    }

    if (request.userId !== userId) {
        throw new ApiError(403, 'Requested user does not match the record.');
    }

    if (request.isAccepted) {
        throw new ApiError(400, 'This blood request has already been accepted.');
    }

    await prisma.requestBlood.update({
        where: { id: requestId },
        data: { isAccepted: isAccepted },
    });

    const qrcodeStatus = await prisma.requestBlood.findFirst({
        where: { id: requestId },
    });

    if (qrcodeStatus.isQrSent) {
        throw new ApiError(400, 'QR code already sent');
    }

     const getqrcodeResponse = await generateqrcode(requestId, userId);

    if (getqrcodeResponse.status === 200) {
        return res.status(200).json(new ApiResponse(200, { message: "Request accepted and QR code generated. Email sent successfully." }));
    } else {
        return res.status(500).json(new ApiResponse(500, { message: "Request accepted, but failed to generate QR code or send email." }));
    }
});
const checkQrAuth = asyncHandler(async (req, res) => {
    const { requestId, userId } = req.body;

    const checkAuth = await prisma.RequestBlood.findFirst({ where: { id: requestId } });
    
    if (!checkAuth) {
        throw new ApiError(404, "Request not found.");
    }

    if (checkAuth.userId !== userId) {
        throw new ApiError(400, "User ID does not match.");
    }

    if (checkAuth.isAproved) {
        throw new ApiError(400, "Request is already approved.");
    }

    // Approve the request
    try {
        await prisma.requestBlood.update({
            where: { id: requestId },
            data: { isAproved: true }
        });

        // Send success response
        res.status(200).json({ status: 200, message: "User authenticated and request approved successfully." });
    } catch (error) {
        console.error("Error approving request:", error);
        throw new ApiError(500, "Failed to authenticate user and approve request.");
    }
});
    
export { acceptRequest, checkQrAuth };
