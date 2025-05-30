import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import adminAuth from '../models/admin.models/auth.model';
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
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return errorResponse(res, 'Authorization token is required', 401);
    }

    const user = await userAuth.findOne({ token });

    if (!user) {
      return errorResponse(res, 'Invalid token', 401);
    }

    // Optional: assuming you store token expiry as a Date in user.tokenExpiry
    if (user.tokenExpiry && new Date(user.tokenExpiry) < new Date()) {
      return errorResponse(res, 'Token expired', 40);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return errorResponse(res, 'Authentication failed', 401);
  }
};

export const adminAuthenticate = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return errorResponse(res, 'Authorization token is required', 401);
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as { userId: string, email: string };

    const admin = await adminAuth.findById(decoded.userId);

    if (!admin) {
      return errorResponse(res, 'Admin not found', 401);
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return errorResponse(res, 'Authentication failed', 401);
  }
};