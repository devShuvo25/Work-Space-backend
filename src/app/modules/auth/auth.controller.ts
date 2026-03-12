import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthServices } from './auth.service';

/**
 * Handles direct user registration.
 * No longer needs a separate verifyOtp step.
 */
const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.register(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

/**
 * Handles standard user login.
 */
const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.login(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Login successful',
    data: result,
  });
});
/**
 * Retrieves the logged-in user's profile data.
 * The 'id' comes from the decoded token attached by auth middleware.
 */
const getMe = catchAsync(async (req: Request, res: Response) => {
  // Extract user id from the request (attached by auth middleware)
  const userId = req.user?.id || req.user?.userId; 
  console.log("User :", req?.user)
  console.log(" is :", userId)
  const result = await AuthServices.getMe(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});
/**
 * Handles direct password reset.
 */
export const AuthController = {
  register,
  login,
  getMe
};