import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from '../utils/ApiError.js';
import prisma from '../../prisma/index.js';

const userRequest = asyncHandler(async (req, res) => {
  const {
    userId,
    bloodTypeId,     
    quantity,
    request_date,
    required_by,
    status,
    delivery_address,
    contact_number,
    reason_for_request,
    hospital_name,
    urgent
  } = req.body;

  if ([userId, bloodTypeId, quantity, request_date, required_by, status, delivery_address, contact_number, reason_for_request, hospital_name].some((field) => field === undefined || field === null)) {
    throw new ApiError(400, 'All fields except urgent are required');
  }

  try {
    const newRequest = await prisma.requestBlood.create({
      data: {
        userId,
        bloodTypeId,
        quantity,
        request_date: new Date(request_date),  
        required_by: new Date(required_by),   
        status,
        delivery_address,
        contact_number,
        reason_for_request,
        hospital_name,
        urgent: urgent ?? false,  
      }
    });

    return res.status(201).json(new ApiResponse(201, newRequest, "Blood request created successfully"));
  } catch (error) {
    console.error("Error creating blood request:", error);
    throw new ApiError(500, "An error occurred while creating the blood request.");
  }
});

const getRequestStatus = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    throw new ApiError(400, "userId is required.");
  }

  const requests = await prisma.requestBlood.findMany({
    where: {
      userId: userId, 
    },
  });

  if(!requests){
      throw new ApiError(400, "No Request Found.");
  }

  res.status(200).json({
    success: true,
    data: requests,
  });
});
const getAllRequest = asyncHandler(async (req, res) => {
  try {
    const requests = await prisma.requestBlood.findMany();
    
    // Check if requests were found
    if (!requests || requests.length === 0) {
      return res.status(404).json({ message: "No requests found." });
    }

    // Send the requests as a response
    return res.status(200).json({ data: requests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export {userRequest, getRequestStatus, getAllRequest};
