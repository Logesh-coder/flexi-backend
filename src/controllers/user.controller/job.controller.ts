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

    const id = req.user;
    const createUserId = req.user?._id;

    const formattedDate = (() => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    })();

    const generateSlug = (text: string) => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    const slug = generateSlug(title);

    const newJob = new JobModule({
      title,
      slug,
      description,
      date: formattedDate,
      budget,
      durationStartTime,
      durationEndTime,
      area,
      city,
      landMark,
      createUserId
    });

    await newJob.save();

    return successResponse(res, newJob, 201)

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
    const {
      area,
      city,
      minBudget,
      maxBudget,
      search,
      date,
      page = 1,
      limit = 10,
    } = req.query;

    const filters: any = {};

    if (area) filters.area = area;
    if (city) filters.city = city;
    if (date) filters.date = date;

    if (minBudget || maxBudget) {
      filters.budget = {};
      if (minBudget) filters.budget.$gte = Number(minBudget);
      if (maxBudget) filters.budget.$lte = Number(maxBudget);
    }

    if (search) {
      filters.title = { $regex: search, $options: 'i' }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const jobs = await JobModule.find(filters)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await JobModule.countDocuments(filters);

    successResponse(res, {
      jobs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    }, 200);
  } catch (error) {
    next(error);
  }
};

export const getSingleJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { slug } = req.params;

    const job = await JobModule.findOne({ slug }).populate('createUserId', 'name email mobile');

    if (!job) {
      errorResponse(res, 'Job not found', 404);
    }

    return successResponse(res, job, 200);

    // const application = await ApplyJobModel.findOne({
    //   jobId: singleId,
    //   userId: findToken?.user?._id
    // });

    // const findAlredyAppled = application ? true : false

    // res.status(200).json({
    //   success: true,
    //   message: "Successfully retrieved single job",
    //   data: {
    //     job,
    //     alreadyApplied: findAlredyAppled
    //   },
    // });

  } catch (error) {
    next(error)
  }
};