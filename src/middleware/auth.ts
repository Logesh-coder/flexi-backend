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
      return errorResponse(res, 'Authorization token is required', 401);
    }

    const { id: userId, type } = verifyToken(token);

    if (type === 'reset') {
      return errorResponse(res, 'Invalid or expired token', 400);
    }

    let user = userId;

    if (!user) {
      user = await userAuth.findById(userId);

      if (!user) {
        return errorResponse(res, 'User not found', 401);
      }
    }

    req.user = user;

    // const cacheKey = `user:${getCache}`;
    // Check if user exists in cache
    // let user = getCache(cacheKey);

    // if (!user) {
    //   user = await UserModel.findById(userId);

    //   if (!user) {
    //     return errorResponse(res, 'User not found', 401);
    //   }

    //   // Cache user data for later requests
    //   setCache(cacheKey, user);
    // }
    // Set user data in request object

    // req.user = user;

    next();
  } catch (error) {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
};