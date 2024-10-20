import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from '../utils/ApiError.js';
import prisma from '../../prisma/index.js';


const addUserInfo = asyncHandler(async (req, res) => {
  const {
    userId,
    firstName,
    middleName,
    lastName,
    bloodType,
    birthDate,
    gender,
    phoneNumber,
    streetAddress,
    streetAddressLine2,
    city,
    state,
    postalCode,
    weight, // Keep this as a string for now
    donatedPreviously,
    lastDonation,
    diseases,
  } = req.body;

  console.log(req.body); // Check the incoming data

  const requiredFields = [
    userId,
    firstName,
    lastName,
    bloodType,
    birthDate,
    gender,
    phoneNumber,
    streetAddress,
    city,
    state,
    postalCode,
    weight,
    diseases,
  ];

  // Check if any required fields are empty or null
  const isAnyFieldEmpty = requiredFields.some(field => !field || (typeof field === 'string' && field.trim() === ''));

  if (isAnyFieldEmpty) {
    throw new ApiError(400, 'All fields are required');
  }

  try {
    const newUserInfo = await prisma.UserInfo.create({
      data: {
        userId,
        firstName,
        middleName,
        lastName,
        bloodType,
        Birth_Date: new Date(birthDate),
        Gender: gender,
        Phone_Number: phoneNumber,
        Street_Address: streetAddress,
        Street_Address_Line_2: streetAddressLine2,
        City: city,
        State: state,
        Postal_Code: postalCode,
        Weight: parseFloat(weight), // Convert weight to Float
        donated_previously: donatedPreviously,
        Last_donation: lastDonation ? new Date(lastDonation) : null,
        Diseases: diseases,
      }
    });
    if(newUserInfo) {
      await prisma.user.update({
        where: { id: userId },
        data: { isFilled: true },
      });
    }


    return res.status(201).json(new ApiResponse(201, newUserInfo, "User information added successfully"));
  } catch (error) {
    console.error(error); // Log the error for debugging
    throw new ApiError(500, "An error occurred while adding the user information.");
  }
});



const updateUserInfo = asyncHandler(async (req, res) => {
  const {
    id, // Assuming you are passing the ID instead of userId
    firstName,
    middleName,
    lastName,
    bloodType,
    birthDate,
    gender,
    phoneNumber,
    streetAddress,
    streetAddressLine2,
    city,
    state,
    postalCode,
    weight, // Keep this as a string for now
    donatedPreviously,
    lastDonation,
    diseases,
  } = req.body;

  console.log("this is request body for update", req.body);
  if (
    [id, firstName, lastName, bloodType, birthDate, gender, phoneNumber, streetAddress, city, state, postalCode, weight, diseases]
      .some(field => field == null || (typeof field === 'string' && field.trim() === ''))
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  try {
    const updatedUserInfo = await prisma.UserInfo.update({
      where: { id }, // Use id instead of userId
      data: {
        firstName,
        middleName,
        lastName,
        bloodType,
        Birth_Date: new Date(birthDate),
        Gender: gender,
        Phone_Number: phoneNumber,
        Street_Address: streetAddress,
        Street_Address_Line_2: streetAddressLine2,
        City: city,
        State: state,
        Postal_Code: postalCode,
        Weight: parseFloat(weight),
        donated_previously: donatedPreviously,
        Last_donation: lastDonation ? new Date(lastDonation) : null,
        Diseases: diseases,
      },
    });

    return res.status(200).json(new ApiResponse(200, updatedUserInfo, "User information updated successfully"));
  } catch (error) {
    console.error("Error updating user information:", error);
    throw new ApiError(500, "An error occurred while updating the user information.");
  }
});



const getUserInfoByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    throw new ApiError(400, "User ID is required.");
  }

  try {
    const userInfo = await prisma.UserInfo.findFirst({
      where: {
        userId: userId, 
      },
    });

    if (!userInfo) {
      throw new ApiError(404, "No user information found for this user.");
    }

    return res.status(200).json(new ApiResponse(200, userInfo, "User information fetched successfully"));
  } catch (error) {
    console.error("Error fetching user information:", error);
    throw new ApiError(500, "An error occurred while fetching the user information.");
  }
});


export { addUserInfo, updateUserInfo, getUserInfoByUserId };
