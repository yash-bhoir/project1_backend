import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from '../utils/ApiError.js';
import prisma from '../../prisma/index.js';
import { generateqrcode } from '../controllers/qr.controller.js'; 

const acceptRequest = asyncHandler(async (req, res) => {   
    const { userId, requestId ,isAccepted} = req.body;

    if (!userId || !requestId) {
        throw new ApiError(400, 'Both requestId, userId, and isAccepted fields are required.');
    }

    const request = await prisma.requestBlood.findUnique({
        where: {
            id: requestId 
        }
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
        where: {
            id: requestId 
        },
        data: {
            isAccepted: isAccepted 
        }
    });

    try {
        const qrcodeStatus = await prisma.requestBlood.findFirst({
            where: {
                id: requestId 
            }
        });
        
        if(qrcodeStatus.isQrSent){
            throw new ApiError(400, 'Qr code already sent');
        }

            const getqrcodeResponse = await generateqrcode(userId, requestId);

            if (getqrcodeResponse.status === 200) {
                return res.status(200).json(new ApiResponse(200, { message: "Request accepted and QR code generated. Email sent successfully." }));
            } else {
                return res.status(500).json(new ApiResponse(500, { message: "Request accepted, but failed to generate QR code or send email." }));
            }

         
    } catch (error) {
        console.error("Error generating QR code:", error);
        return res.status(500).json(new ApiResponse(500, { message: "Request accepted, but an error occurred during QR code generation." }));
    }
});

export { acceptRequest };
