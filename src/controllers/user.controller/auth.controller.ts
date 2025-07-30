import axios from 'axios';
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';
import nodemailer from "nodemailer";
import userAuth from "../../models/user.models/auth.model";
import { userWishlist } from '../../models/user.models/wishlist';
import { CustomUser } from "../../type/user-type";
import cache from "../../utils/cache";
import { errorResponse, successResponse } from "../../utils/response.util";

export interface CustomRequest extends Request {
  user?: CustomUser;
}

export const handleGoogleCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI!;
  const frontendUrl = process.env.WEBSITE_LINK || 'http://localhost:3000';

  try {
    // 1. Exchange code for access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenResponse.data;

    console.log('access_token', access_token)

    if (!access_token) {
      return res.status(401).json({ message: 'Failed to get access token from Google' });
    }

    // 2. Get user info from Google
    const googleUser = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { name, email } = googleUser.data;

    if (!email) {
      return res.status(400).json({ message: 'Google account has no email' });
    }

    // 3. Check if user exists in DB
    let user = await userAuth.findOne({ email });

    if (!user) {
      // 4. Generate slug from name 
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-');

      // 5. Create new user
      user = new userAuth({
        name,
        email,
        slug,
        // isActive: true,
      });

      await user.save();
    }

    // 6. Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.SECRET_KEY as string,
      { expiresIn: '8h' }
    );

    user.token = token;
    await user.save();

    // 7. Redirect to frontend with token
    const successUrl = `${frontendUrl}/login?token=${token}&isActive=${user.isActive}`;
    return res.redirect(successUrl);
  } catch (err) {
    console.error('Google OAuth Error:', err);
    return res.status(500).json({ message: 'Google authentication failed' });
  }
};

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

    // if (mobile && mobile !== user.mobile) {
    //   const existingUser = await userAuth.findOne({ mobile });
    //   if (existingUser) {
    //     return errorResponse(res, 'Mobile number is already in use.', 400);
    //   }
    // }

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
      checkUpdateUser?.mobile &&
      checkUpdateUser?.date_of_birth &&
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
    const { search, city, area, page = 1, limit = 10 } = req.query;
    const token = req.headers['authorization']?.split(' ')[1];

    let user;
    if (token) {
      user = await userAuth.findOne({ token }).select('_id');
    }

    const filters: any = { isActive: true };
    if (city) filters.city = city;
    if (area) filters.area = area;

    const aggregationPipeline: any[] = [];

    // ✅ Step 1: Atlas $search (only if search is provided)
    if (search) {
      aggregationPipeline.push({
        $search: {
          index: 'userSearchIndex',
          compound: {
            should: [
              {
                autocomplete: {
                  query: search,
                  path: 'domain',
                  fuzzy: {
                    maxEdits: 1,
                    prefixLength: 1
                  }
                }
              },
              {
                autocomplete: {
                  query: search,
                  path: 'name',
                  fuzzy: {
                    maxEdits: 1,
                    prefixLength: 1
                  }
                }
              }
            ]
          }
        }
      });
    }

    // ✅ Step 2: Apply filters (city, area)
    if (Object.keys(filters).length > 0) {
      aggregationPipeline.push({ $match: filters });
    }

    // ✅ Step 3: Sort and Paginate
    aggregationPipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) }
    );

    // ✅ Step 4: Wishlist Lookup
    aggregationPipeline.push(
      {
        $lookup: {
          from: 'userwishlists',
          let: { workerId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$workerId', '$$workerId'] },
                    { $eq: ['$userId', new mongoose.Types.ObjectId(user?._id)] }
                  ]
                }
              }
            }
          ],
          as: 'wishlist'
        }
      },
      {
        $addFields: {
          isSaved: { $gt: [{ $size: '$wishlist' }, 0] }
        }
      },
      {
        $project: {
          wishlist: 0
        }
      }
    );

    // ✅ Execute aggregation
    const workers = await userAuth.aggregate(aggregationPipeline);

    // ✅ Separate count for pagination metadata
    const countPipeline: any[] = [];

    if (search) {
      countPipeline.push({
        $search: {
          index: 'userSearchIndex',
          compound: {
            should: [
              {
                autocomplete: {
                  query: search,
                  path: 'domain',
                  fuzzy: {
                    maxEdits: 1,
                    prefixLength: 1
                  }
                }
              },
              {
                autocomplete: {
                  query: search,
                  path: 'name',
                  fuzzy: {
                    maxEdits: 1,
                    prefixLength: 1
                  }
                }
              }
            ]
          }
        }
      });
    }

    if (Object.keys(filters).length > 0) {
      countPipeline.push({ $match: filters });
    }

    countPipeline.push({ $count: 'total' });

    const countResult = await userAuth.aggregate(countPipeline);
    const totalItems = countResult[0]?.total || 0;

    // ✅ Send response
    res.status(200).json({
      success: true,
      data: {
        workers,
        page: Number(page),
        totalPages: Math.ceil(totalItems / Number(limit)),
        totalItems
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getSingleWorker = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const token = req.headers['authorization']?.split(' ')[1];

    const cacheKey = `worker:${slug}`;

    // Optional: skip cache if you want dynamic wishlist status
    const cached = cache.get(cacheKey);
    if (cached && !token) {
      return successResponse(res, cached, 200);
    }

    // 🔐 Get logged-in user (if any)
    let userId;
    if (token) {
      const user = await userAuth.findOne({ token }).select('_id');
      if (user) userId = user._id;
    }

    // 🧾 Get worker details
    const findUser = await userAuth
      .findOne({ slug })
      .select('-password -__v -token');

    if (!findUser) {
      return errorResponse(res, 'worker not found', 500);
    }

    // ❤️ Check if this worker is in the user's wishlist
    let isSaved = false;
    if (userId) {
      const wishlistItem = await userWishlist.findOne({
        userId,
        workerId: findUser._id
      });

      isSaved = !!wishlistItem;
    }

    // ✅ Add isSaved field to response
    const result = {
      ...findUser.toObject(),
      isSaved
    };

    // ✅ Cache the result only if token is not present (so result is universal)
    if (!token) {
      cache.set(cacheKey, result);
    }

    return successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const inActiveUser = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const findUser = await userAuth.findOne({ id })

    if (!findUser) {
      return errorResponse(res, 'worker not found', 500);
    }

    findUser.isActive = false;
    await findUser.save();

    return successResponse(res, findUser, 200);

  } catch (error) {
    next(error)
  }
}