import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import adminModel from "../../models/admin.models/auth.model";
import { successResponse } from "../../utils/response.util";
import { errorResponse } from './../../utils/response.util';

export const loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const adminLogin = await adminModel.findOne({ email });

    if (!adminLogin) {
      return errorResponse(res, 'Please enter a email or password', 401)
    }

    const isPasswordMatch = await bcrypt.compare(password, adminLogin.password);

    if (!isPasswordMatch) {
      return errorResponse(res, 'Invalid email or password', 400)
    }

    const token = jwt.sign(
      { userId: adminLogin._id, email: adminLogin.email },
      process.env.SECRET_KEY as string,
      { expiresIn: "8h" }
    );

    adminLogin.token = token;
    await adminLogin.save();
    return successResponse(res, token, 200)
  } catch (error) {
    next(error);
  }
};

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, 'Authorization header with Bearer token is required', 400)
    }

    const token = authHeader.split(" ")[1];

    const admin = await adminModel.findOne({ token });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not found",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY as string);
    } catch (err) {
      return errorResponse(res, 'Invalid or expired token', 400)
    }

    successResponse(res, 'Token is valid', 200)
  } catch (error) {
    next(error)
  }
};
