import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import adminModel from "../../models/admin.models/auth.model";
import { successResponse } from "../../utils/response.util";

exports.registerAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, mobile, password } = req.body;

    const existingAdmin = await adminModel.findOne({ email, mobile });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "admin already registered with this email or password",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newAdmin = new adminModel({
      ...req.body,
      password: hashedPassword,
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: "admin registered successfully",
      data: newAdmin,
    });
  } catch (error) {
    next(error)
  }
};

exports.loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const adminLogin = await adminModel.findOne({ email });

    if (!adminLogin) {
      return res.status(401).json({
        success: false,
        message: "Please enter a email or password",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, adminLogin.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: adminLogin._id, email: adminLogin.email },
      process.env.SECRET_KEY as string,
      { expiresIn: "8h" }
    );

    adminLogin.token = token;
    await adminLogin.save();

    res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({
        success: false,
        message: "Authorization header with Bearer token is required",
      });
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
      console.error("JWT verification failed:", err);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    successResponse(res, 'Token is valid', 200)
  } catch (error) {
    next(error)
  }
};
