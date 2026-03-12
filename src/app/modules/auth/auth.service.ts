import * as bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import AppError from '../../errors/AppError';
import { generateToken } from '../../utils/generateToken';
import prisma from '../../utils/prisma';
import { ILoginUser, IRegisterUser } from './auth.interface';
import { UserRole } from '@prisma/client';

/**
 * Register: Creates the user directly in the database.
 */
const register = async (payload: IRegisterUser) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, 'User already registered');
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds) || 12
  );

  // Create User and Profile in a single transaction
  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: payload.role as UserRole,
      isEmailVerified: true, // Auto-verified since we removed OTP
      profile: {
        create: {} // Initializes empty freelancer/client profile
      }
    },
  });

  const accessToken = generateToken(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  return { 
    user,
    accessToken 
  };
};

/**
 * Login: Standard credentials verification.
 */
const login = async (payload: ILoginUser) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user || !user.password) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
  }

  const isPasswordMatch = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
  }

  const accessToken = generateToken(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  return { 
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    accessToken 
  };
};
/**
 * Get Me: Retrieves the current logged-in user's data and their professional profile.
 */
const getMe = async (id: string) => {
  console.log(id)
  const result = await prisma.user.findUnique({
    where: {
      id,
      status: 'ACTIVE', // Ensure suspended users can't fetch their data
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      address : true,
      image: true,
      isEmailVerified: true,
      createdAt: true,
      // Include the professional profile automatically
      profile: true, 
    },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found or account is inactive');
  }

  return result;
};

/**
 * Reset Password: Direct update without OTP verification.
 */
const resetPassword = async (payload: any) => {
  const { email, newPassword } = payload;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  return { message: 'Password reset successfully' };
};

export const AuthServices = {
  register,
  login,
  resetPassword,
  getMe
};