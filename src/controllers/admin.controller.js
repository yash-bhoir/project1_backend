import { ApiError } from '../utils/ApiError.js';
import prisma from '../../prisma/index.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateqrcode } from '../controllers/qr.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const acceptRequest = asyncHandler(async (req, res) => {
    const { userId, requestId, isAccepted } = req.body;

    console.log("Request body:", req.body);

    // Validate the input
    if (!userId || !requestId) {
        throw new ApiError(400, 'Both requestId and userId fields are required.');
    }

    // Fetch the existing blood request
    const request = await prisma.requestBlood.findFirst({
        where: { id: requestId },
    });

    // Check if the request exists
    if (!request) {
        throw new ApiError(404, 'Blood request not found.');
    }

    // Verify user ownership of the request
    if (request.userId !== userId) {
        throw new ApiError(403, 'Requested user does not match the record.');
    }

    // Prevent acceptance of already accepted requests
    if (request.isAccepted) {
        throw new ApiError(400, 'This blood request has already been accepted.');
    }

    // Update the request with the acceptance status
    await prisma.requestBlood.update({
        where: { id: requestId },
        data: {
            isAccepted: isAccepted,
            status: isAccepted ? 'Accepted' : 'Rejected'
        },
    });

    // Check if the QR code should be sent or not
    if (isAccepted) {
        // Check if QR code has already been sent
        const qrcodeStatus = await prisma.requestBlood.findFirst({
            where: { id: requestId },
        });

        if (qrcodeStatus.isQrSent) {
            throw new ApiError(400, 'QR code already sent.');
        }

        // Generate the QR code and send email
        const getqrcodeResponse = await generateqrcode(requestId, userId);

        if (getqrcodeResponse.status === 200) {
            return res.status(200).json(new ApiResponse(200, {
                message: "Request accepted and QR code generated. Email sent successfully."
            }));
        } else {
            return res.status(500).json(new ApiResponse(500, {
                message: "Request accepted, but failed to generate QR code or send email."
            }));
        }
    } else {
        // Handle rejection case
        return res.status(200).json(new ApiResponse(200, {
            message: "Request rejected successfully."
        }));
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

const getAllUser = asyncHandler(async (req, res) => {
    // Extract the userId from the request (set by the verifyJWT middleware)
    const userId = req.user?.id;

    // Fetch the user to check their role
    const requestingUser = await prisma.User.findUnique({
        where: { id: userId },
    });

    if (!requestingUser) {
        throw new ApiError(400, "User not found.");
    }

    // Check if the requesting user has an admin role
    if (requestingUser.role !== 'Admin') {
        throw new ApiError(403, "You are not authorized to access this resource.");
    }

    // Fetch all users since the requester is an admin
    const users = await prisma.User.findMany({
        select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
            role: true,
        },
    });

    if (!users.length) {
        throw new ApiError(400, "No users found.");
    }

    // Return the list of users
    return res.status(200).json(new ApiResponse(200, users, "All users fetched successfully."));
});


const changeRole = asyncHandler(async (req, res) => {
    const { userId, role } = req.body; 
    if (!userId) {
        throw new ApiError(400, "No User Found");
    }

    if (!role) {
        throw new ApiError(400, "Role not provided");
    }

    const updatedUser = await prisma.User.update({
        where: { id: userId },
        data: { role: role } 
    });

    return res.status(200).json(new ApiResponse(200, updatedUser, "User role updated successfully."));
});



export { acceptRequest, checkQrAuth, getAllUser, changeRole };
