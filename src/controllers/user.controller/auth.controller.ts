import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import userAuth from "../../models/user.models/auth.model";
import { errorResponse, successResponse } from "../../utils/response.util";

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, mobile, password, name, date_of_birth } = req.body;

    const existingUser = await userAuth.findOne({ $or: [{ email }, { mobile }] });

    if (existingUser) {
      return errorResponse(res, 'User already registered with this email or mobile', 409);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new userAuth({
      name,
      date_of_birth,
      email,
      mobile,
      password: hashedPassword,
    });

    await newUser.save();

    successResponse(res, newUser, 201);
  } catch (error) {
    next(error)
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const userLogin = await userAuth.findOne({ email });

    if (!userLogin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, userLogin.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: userLogin._id, email: userLogin.email },
      process.env.SECRET_KEY as string,
      { expiresIn: "8h" }
    );

    userLogin.token = token;
    await userLogin.save();

    successResponse(res, token, 200);

  } catch (error) {
    next(error)
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await userAuth.findOne({ email });

    if (!user) {
      return errorResponse(res, 'User with this email does not exist', 404)
    }

    const resetToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY as string, {
      expiresIn: "1h",
    });

    const resetLink = `${process.env.FRONT_END_URL}/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log("user", user)

    const mailOptions = {
      from: email,
      to: user.email,
      subject: "Password Reset",
      html: `<p>You requested a password reset</p>
             <p>Click this <a href="${resetLink}">link</a> to reset your password.</p>`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    user.resetPasswordToken = resetToken;
    await user.save();

    return successResponse(res, "Password reset link has been sent to your email", 200)
  } catch (error) {
    next(error)
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!newPassword) {
      return errorResponse(res, 'Password fields cannot be empty', 400)
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    const user = await userAuth.findOne({
      token,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token user",
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password and clear the reset token and expiration time
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    successResponse(res, 'Password has been reset successfully', 200)
  } catch (error) {
    next(error)
  }
};

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({
        success: false,
        message: "Authorization header with Bearer token is required",
      });
    }

    // Extract the token from the header
    const token = authHeader.split(" ")[1];

    // Find the user with the provided token
    const user = await userAuth.findOne({ token });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify the token using JWT and get the decoded payload
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY as string);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Token is valid
    res.status(200).json({
      success: true,
      message: "Token is valid",
      data: {
        userId: user._id,
        email: user.email,
      },
    });

  } catch (error) {
    next(error)
  }
};