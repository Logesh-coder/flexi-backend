import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import userAuth from '../models/user.models/auth.model';
import { errorResponse } from '../utils/response.util';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: { phoneNumber: string };
}

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const authenticate = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return errorResponse(res, 'Authorization token is required', 400);
    }

    const user = await userAuth.findOne({ token: token })

    // let userId = user?._id;

    // if (!user) {
    //   user = await userAuth.findById(userId);

    //   if (!user) {
    //     return errorResponse(res, 'User not found', 401);
    //   }
    // }

    req.user = user;

    next();
  } catch (error) {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
};