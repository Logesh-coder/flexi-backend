import { NextFunction, Request, Response } from "express";
import { default as userAuth } from "../../models/user.models/auth.model";
import JobModule from "../../models/user.models/job.model";
import { wishlist } from "../../models/user.models/wishlist";
import { errorResponse, successResponse } from "../../utils/response.util";
import { CustomRequest } from "./auth.controller";

export const createJobForm = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, budget, date, durationStartTime, durationEndTime, area, city, landMark } = req.body

    const isActive = req.user?.isActive;
    const createUserId = req.user?._id;

    if (!isActive) {
      return errorResponse(res, 'Your profile is not active. Please activate your account.', 500)
    }

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

export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      area,
      city,
      minBudget,
      maxBudget,
      search,
      date,
      id,
      page = 1,
      limit = 10,
    } = req.query;

    const token = req.headers['authorization']?.split(' ')[1];

    let user;
    if (token) {
      user = await userAuth.findOne({ token }).select('_id');
    }

    const filters: any = {};

    if (id === 'true') filters.createUserId = user?._id;
    if (area) filters.area = area;
    if (city) filters.city = city;
    if (date) filters.date = date;

    if (minBudget || maxBudget) {
      filters.budget = {};
      if (minBudget) filters.budget.$gte = Number(minBudget);
      if (maxBudget) filters.budget.$lte = Number(maxBudget);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const aggregationPipeline: any[] = [];

    if (search) {
      aggregationPipeline.push({
        $search: {
          index: 'jobSearchIndex',
          text: {
            query: search,
            path: 'title',
            fuzzy: {
              maxEdits: 2,
              prefixLength: 100,
            },
          },
        },
      });

      // You can still apply filters after search
      aggregationPipeline.push({ $match: filters });
    } else {
      aggregationPipeline.push({ $match: filters });
    }

    aggregationPipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'wishlists',
          let: { jobId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$jobId', '$$jobId'] },
                    { $eq: ['$userId', user?._id] },
                  ],
                },
              },
            },
          ],
          as: 'wishlist',
        },
      },
      {
        $addFields: {
          isSaved: {
            $cond: {
              if: { $gt: [{ $size: '$wishlist' }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $lookup: {
          from: 'userauthregisters',
          let: { userId: '$createUserId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$userId'] },
              },
            },
            {
              $project: {
                _id: 0,
                mobile: 1,
              },
            },
          ],
          as: 'createUser',
        },
      },
      {
        $unwind: {
          path: '$createUser',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          wishlist: 0,
        },
      }
    );

    const jobs = await JobModule.aggregate(aggregationPipeline);

    // For search, we can't use countDocuments directly
    const total = search
      ? jobs.length // Approximate, since we can't use $count after $search easily
      : await JobModule.countDocuments(filters);

    return successResponse(res, {
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

    const job = await JobModule.findOne({ slug }).populate('createUserId', 'name email mobile ').lean();

    if (!job) {
      errorResponse(res, 'Job not found', 404);
    }

    const token = req.headers['authorization']?.split(' ')[1];
    let isSaved = false;

    if (token) {
      const user = await userAuth.findOne({ token }).select('_id');
      if (user) {
        const saved = await wishlist.exists({ userId: user._id, jobId: job._id });
        isSaved = !!saved;
      }
    }
    return successResponse(res, { ...job, isSaved }, 200);

  } catch (error) {
    next(error)
  }
};

export const updateJobForm = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const {
      title,
      description,
      budget,
      date,
      durationStartTime,
      durationEndTime,
      area,
      city,
      landMark
    } = req.body;

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

    const updatedSlug = generateSlug(title);

    const updatedJob = await JobModule.findOneAndUpdate(
      { slug },
      {
        title,
        slug: updatedSlug,
        description,
        date: formattedDate,
        budget,
        durationStartTime,
        durationEndTime,
        area,
        city,
        landMark,
      },
      { new: true } // return the updated document
    );

    if (!updatedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    return successResponse(res, updatedJob, 200);
  } catch (error) {
    next(error);
  }
};
