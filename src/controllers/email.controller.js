import { asyncHandler } from '../utils/asyncHandler.js';
import { sendEmail } from '../utils/emailService.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from '../utils/ApiError.js';

const sendEmailController = async (to, subject, htmlContent, qrCodeBuffer) => {
  console.log("all fields :: ", to, subject, htmlContent);
  
  if (!to || !subject || !htmlContent || !qrCodeBuffer) {
    throw new ApiError(400, "All fields (to, subject, htmlContent, qrCodeBuffer) are required.");
  }

  try {
    await sendEmail(to, subject, htmlContent, qrCodeBuffer);
    return { status: 200, message: "Email sent successfully." };
  } catch (error) {
    console.error('Error sending email:', error); 
    throw new ApiError(500, "Error sending email.");
  }
};

export { sendEmailController };
