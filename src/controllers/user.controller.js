import bcrypt from "bcrypt";
import prisma from "../../prisma/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/AccessRefreshToken.js";
import jwt from "jsonwebtoken";
import { error } from "console";
import { sendEmail } from "../utils/emailService.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      `Something went wrong while generating tokens: ${error.message}`
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if ([username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });

  if (existingUser) {
    throw new ApiError(409, "User with username or email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username: username.toLowerCase(),
      email,
      password: hashedPassword,
    },
  });

  const userCreated = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      username: true,
    },
  });

  if (!userCreated) {
    throw new ApiError(500, "Something went wrong while creating user");
  }

  res
    .status(201)
    .json(new ApiResponse(201, userCreated, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    throw new ApiError(400, "Username or email and password are required");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user.id
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: refreshToken },
  });

  const loggedInUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const logoutToken = req.cookies.accessToken || req.body.accessToken;

  if (!logoutToken) {
    throw new ApiError(401, "Unauthorized request: No refresh token provided");
  }

  const decodedToken = jwt.verify(logoutToken, process.env.ACCESS_TOKEN_SECRET);
  console.log("Decoded Token:", decodedToken);

  await prisma.user.update({
    where: { id: decodedToken._id },
    data: { refreshToken: null },
  });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request: No refresh token provided");
  }

  try {
    const checkToken = await prisma.user.findFirst({
      where: { refreshToken: incomingRefreshToken },
    });

    if (!checkToken) {
      throw new ApiError(401, "Unauthorized request: Invalid refresh token");
    }

    console.log(checkToken);

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("Decoded Token:", decodedToken);

    const user = await prisma.user.findUnique({
      where: { id: decodedToken._id },
    });

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token: User not found");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh Token is Expired or Used");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user.id
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    console.error("Error refreshing access token:", error.message);
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const getUserFormStatus = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  console.log("this is user id", userId);

  if (!userId) {
    throw new ApiError(401, "UserId not found");
  }
  const getUser = await prisma.user.findFirst({
    where: { id: userId },
    select: {
      isFilled: true,
    },
  });

  if (!getUser) {
    throw new ApiError(401, "Something went wrong while getting form status");
  }

  return res.status(201).json(new ApiResponse(201, getUser, "Status found"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { emailId } = req.body;

  if (!emailId) {
    throw new ApiError(400, "EmailId is required");
  }

  const user = await prisma.user.findUnique({
    where: { email: emailId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { email: emailId },
    data: {
      otp,
      otpExpiresAt,
    },
  });

  const emailSubject = "Your Password Reset OTP";
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Your OTP</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
    </head>
    <body style="margin: 0; font-family: 'Poppins', sans-serif; background: #ffffff; font-size: 14px;">
      <div style="max-width: 680px; margin: 0 auto; padding: 45px 30px 60px; background: #f4f7ff; background-image: url(https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661497957196_595865/email-template-background-banner); background-repeat: no-repeat; background-size: 800px 452px; background-position: top center; font-size: 14px; color: #434343;">
        <header>
          <table style="width: 100%;">
            <tbody>
              <tr style="height: 0;">
                <td><img alt="Company Logo" src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1663574980688_114990/archisketch-logo" height="30px" /></td>
                <td style="text-align: right;"><span style="font-size: 16px; line-height: 30px; color: #ffffff;">${new Date().toDateString()}</span></td>
              </tr>
            </tbody>
          </table>
        </header>

        <main>
          <div style="margin: 0; margin-top: 70px; padding: 92px 30px 115px; background: #ffffff; border-radius: 30px; text-align: center;">
            <div style="width: 100%; max-width: 489px; margin: 0 auto;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 500; color: #1f1f1f;">Your OTP</h1>
              <p style="margin: 0; margin-top: 17px; font-size: 16px; font-weight: 500;">Hey ${
                user.name || "User"
              },</p>
              <p style="margin: 0; margin-top: 17px; font-weight: 500; letter-spacing: 0.56px;">
                Thank you for choosing Archisketch Company. Use the following OTP to complete your password reset. The OTP is valid for <span style="font-weight: 600; color: #1f1f1f;">10 minutes</span>. Do not share this code with others, including Archisketch employees.
              </p>
              <p style="margin: 0; margin-top: 60px; font-size: 40px; font-weight: 600; letter-spacing: 25px; color: #ba3d4f;">${otp}</p>
            </div>
          </div>

          <p style="max-width: 400px; margin: 0 auto; margin-top: 90px; text-align: center; font-weight: 500; color: #8c8c8c;">
            Need help? Ask at <a href="mailto:archisketch@gmail.com" style="color: #499fb6; text-decoration: none;">archisketch@gmail.com</a> or visit our <a href="#" target="_blank" style="color: #499fb6; text-decoration: none;">Help Center</a>.
          </p>
        </main>

        <footer style="width: 100%; max-width: 490px; margin: 20px auto 0; text-align: center; border-top: 1px solid #e6ebf1;">
          <p style="margin: 0; margin-top: 40px; font-size: 16px; font-weight: 600; color: #434343;">Archisketch Company</p>
          <p style="margin: 0; margin-top: 8px; color: #434343;">Address 540, City, State.</p>
          <div style="margin: 0; margin-top: 16px;">
            <!-- Social icons here -->
          </div>
          <p style="margin: 0; margin-top: 16px; color: #434343;">Copyright © 2024 Company. All rights reserved.</p>
        </footer>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail(emailId, emailSubject, emailHtml);
    res.status(200).json({
      message: "OTP sent to your email address.",
    });
  } catch (error) {
    throw new ApiError(500, "Error sending OTP email. Please try again later.");
  }
});

const validateOTP = asyncHandler(async (req, res) => {
  const { emailId, otp } = req.body;
  console.log("OTP:",  otp);

  console.log("Type of OTP:", typeof otp);

  if (!emailId || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await prisma.user.findUnique({
    where: { email: emailId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  
  if (user.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (new Date() > user.otpExpiresAt) {
    throw new ApiError(400, "OTP has expired");
  }

  // Expire OTP by resetting it in the database
  await prisma.user.update({
    where: { email: emailId },
    data: {
      otp: null,              // Clear the OTP
      otpExpiresAt: null,     // Clear the expiration time
    },
  });

  // Create a response with only userId and emailId
  const responseData = {
    id: user.id,               // User ID
    email: user.email,         // Email ID
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "OTP validated successfully, and OTP has been expired"));
});


const resetPassword = asyncHandler(async (req, res) => {
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    throw new ApiError(400, "User ID and new password are required");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password reset successfully"));
});




export {
  registerUser,
  loginUser,
  logoutUser,
  generateAccessAndRefreshTokens,
  refreshAccessToken,
  getUserFormStatus,
  forgotPassword,
  validateOTP,
  resetPassword,
};
