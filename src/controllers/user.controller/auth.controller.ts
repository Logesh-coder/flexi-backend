import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import userAuth from "../../models/user.models/auth.model";
import { CustomUser } from "../../type/user-type";
import { errorResponse, successResponse } from "../../utils/response.util";

export interface CustomRequest extends Request {
  user?: CustomUser;
}

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, mobile, password, name, date_of_birth } = req.body;

    const existingUser = await userAuth.findOne({ $or: [{ email }, { mobile }] });

    if (existingUser) {
      return errorResponse(res, 'User already registered with this email or mobile', 409);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // remove special chars
      .replace(/\s+/g, '-')      // spaces to hyphens
      .replace(/--+/g, '-');

    const newUser = new userAuth({
      name,
      date_of_birth,
      email,
      mobile,
      password: hashedPassword,
      slug
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

    console.log('userLogin', userLogin)

    const data = {
      token,
      isActive: userLogin.isActive
    }

    successResponse(res, data, 200);

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

export const profile = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.user?._id;

    const findUser = await userAuth.findOne({ _id: id })

    if (!findUser) {
      return errorResponse(res, 'user not found', 500);
    }

    return successResponse(res, findUser, 200);

  } catch (error) {
    next(error)
  }
}

export const profileEdit = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.user?._id;

    const { name, mobile, date_of_birth, instaProfileLink, salary, domain, city, area } = req.body;

    if (!id) {
      return errorResponse(res, 'User ID is required', 400);
    }

    const user = await userAuth.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (mobile && mobile !== user.mobile) {
      const existingUser = await userAuth.findOne({ mobile });
      if (existingUser) {
        return errorResponse(res, 'Mobile number is already in use.', 400);
      }
    }

    const updatedUser = await userAuth.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(mobile && { mobile }),
        ...(date_of_birth && { date_of_birth }),
        ...(instaProfileLink && { instaProfileLink }),
        ...(salary && { salary }),
        ...(city && { city }),
        ...(area && { area }),
        ...(domain && { domain }),
      },
      { new: true }
    );

    if (!updatedUser) {
      return errorResponse(res, 'User not found', 404);
    }

    const checkUpdateUser = await userAuth.findById(id);

    if (
      checkUpdateUser?.city &&
      checkUpdateUser?.area &&
      checkUpdateUser?.salary &&
      checkUpdateUser?.domain
    ) {
      checkUpdateUser.isActive = true;
      await checkUpdateUser.save();
    }



    return successResponse(res, updatedUser, 200);
  } catch (error) {
    next(error);
  }
};

export const updatePssword = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.user?._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current and new password are required', 400);
    }

    const user = await userAuth.findById(id).select('+password');
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect', 401);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    return successResponse(res, 'Password updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getWorkers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      area,
      city,
      minBudget,
      maxBudget,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filters: any = { isActive: true };

    if (area) filters.area = area;
    if (city) filters.city = city;

    if (minBudget || maxBudget) {
      filters.salary = {};
      if (minBudget) filters.salary.$gte = Number(minBudget);
      if (maxBudget) filters.salary.$lte = Number(maxBudget);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const aggregationPipeline: any[] = [];

    if (search) {
      aggregationPipeline.push({
        $search: {
          index: 'workerSearchIndex',
          text: {
            query: search,
            path: ['domain', 'name'],
            fuzzy: {
              maxEdits: 2,
              prefixLength: 1,
            },
          },
        },
      });

      // Apply filters after $search
      aggregationPipeline.push({ $match: filters });
    } else {
      aggregationPipeline.push({ $match: filters });
    }

    aggregationPipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
      {
        $project: {
          password: 0,
          token: 0,
          __v: 0,
        },
      }
    );

    const workers = await userAuth.aggregate(aggregationPipeline);

    const total = search
      ? workers.length
      : await userAuth.countDocuments(filters);

    successResponse(res, {
      workers,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    }, 200);
  } catch (error) {
    next(error);
  }
};

export const getSingleWorker = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const findUser = await userAuth.findOne({ slug: slug }).select('-password -__v -token')

    if (!findUser) {
      return errorResponse(res, 'worker not found', 500);
    }

    return successResponse(res, findUser, 200);

  } catch (error) {
    next(error)
  }
}