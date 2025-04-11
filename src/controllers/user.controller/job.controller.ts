import { NextFunction, Request, Response } from "express";
import nodemailer from "nodemailer";
import ApplyJobModel from "../../models/user.models/apply-job.model";
import userAuthModul from "../../models/user.models/auth.model";
import JobModule from "../../models/user.models/job.model";
import { errorResponse, successResponse } from "../../utils/response.util";
import findUserByToken from "../../utils/token-uncations.util";

export interface CustomUser extends Document {
  _id: string;
  name: string;
  email: string;
  mobile: number;
  token: string;
}

export interface CustomRequest extends Request {
  user?: CustomUser;
}

export const createJobForm = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, budget, date, durationStartTime, durationEndTime, area, city, landMark } = req.body

    const createUserId = req.user?._id;

    const newJob = new JobModule({
      title,
      description,
      date,
      payRate: budget,
      durationStartTime,
      durationEndTime,
      area,
      city,
      landMark,
      createUserId
    });

    await newJob.save();

    return successResponse(res, 'Job created successfully', 201)

  } catch (error) {
    next(error)
  }
}

export const userApplyJobForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      errorResponse(res, 'Token is missing', 400)
    }

    const findUser = await findUserByToken(token);

    if (!findUser?.success) {
      errorResponse(res, findUser?.message, 400)
    }

    const userId = findUser?.user?._id;

    const { applyJob_id, payYourAmount } = req.body;

    const existingApplication = await ApplyJobModel.findOne({ userId, applyJob_id });

    if (existingApplication) {
      errorResponse(res, 'You have already submitted an application for this job.', 400)
    }

    const storeApplyJobs = new ApplyJobModel({
      applyJob_id,
      payYourAmount,
      userId
    });

    await storeApplyJobs.save();

    const findJobOwner = await JobModule.findOne({ _id: applyJob_id });

    if (!findJobOwner) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const findJobPostUserData = await userAuthModul.findOne({ _id: findJobOwner?.createUserId });

    if (!findJobPostUserData) {
      return res.status(404).json({
        success: false,
        message: 'Job owner not found'
      });
    }

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

    const mailOptions = {
      from: process.env.MAIL_USERNAME,
      to: findJobPostUserData.email,
      subject: "Applied candidate in your job",
      html: `<h2>Please check your job</h2>
              <h3> Job Title: ${findJobOwner?.title} </h3>
              <h3>Click this link: <a href="${process.env.WEBSITE_LINK}">${process.env.WEBSITE_LINK}</a></h3>`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      success: true,
      message: 'Job application submitted successfully',
      data: storeApplyJobs
    });

  } catch (error) {
    next(error)
  }
};

export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit } = req.query

    const jobs = await JobModule.find().limit(limit);

    res.status(200).json({
      success: true,
      message: "Jobs data retrieved successfully",
      data: jobs,
    });

    successResponse(res, 'Jobs data retrieved successfully', 200)
  } catch (error) {
    next(error)
  }
};

export const getSingleJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
      return res.status(400).json({
        success: false,
        message: "Authorization header with Bearer token is required",
      });
    }

    const findToken = await findUserByToken(token)

    if (!findToken?.success) {
      errorResponse(res, findToken.message, 400);
    }

    const singleId = req.params.id;

    const job = await JobModule.findById(singleId);

    if (!job) {
      errorResponse(res, 'Job not found', 404);
    }

    const application = await ApplyJobModel.findOne({
      jobId: singleId,
      userId: findToken?.user?._id
    });

    const findAlredyAppled = application ? true : false

    res.status(200).json({
      success: true,
      message: "Successfully retrieved single job",
      data: {
        job,
        alreadyApplied: findAlredyAppled
      },
    });

  } catch (error) {
    next(error)
  }
};