import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import userAuth from "../../models/user.models/auth.model";
import JobModule from "../../models/user.models/job.model";
import { wishlist } from "../../models/user.models/wishlist";
import cache from "../../utils/cache";
import { errorResponse, successResponse } from "../../utils/response.util";
import { CustomRequest } from "./auth.controller";


export const createJobForm = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, budget, date, durationStartTime, durationEndTime, area, city, landMark, contact } = req.body

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
      createUserId,
      contact
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
    if (id === 'true' && user?._id) {
      filters.createUserId = new mongoose.Types.ObjectId(user._id);
    }
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

    // 🔍 Add Atlas Search logic with compound filters
    if (search) {
      const filterConditions: any[] = [];

      if (area) filterConditions.push({ equals: { path: 'area', value: area } });
      if (city) filterConditions.push({ equals: { path: 'city', value: city } });
      if (date) filterConditions.push({ equals: { path: 'date', value: date } });

      if (minBudget || maxBudget) {
        const range: any = { path: 'budget' };
        if (minBudget) range.gte = Number(minBudget);
        if (maxBudget) range.lte = Number(maxBudget);
        filterConditions.push({ range });
      }

      if (id === 'true' && user?._id) {
        filterConditions.push({
          equals: {
            path: 'createUserId',
            value: user._id,
          },
        });
      }

      aggregationPipeline.push({
        $search: {
          index: 'jobSearchIndex',
          compound: {
            must: [
              {
                autocomplete: {
                  query: search,
                  path: 'title',
                  fuzzy: {
                    maxEdits: 1,
                    prefixLength: 1,
                  },
                },
              },
            ],
            filter: filterConditions,
          },
        }

      });


    } else {
      aggregationPipeline.push({ $match: filters });
    }

    // 📦 Facet Pipeline
    aggregationPipeline.push({
      $facet: {
        jobs: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: Number(limit) },

          ...(user?._id ? [
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
                          { $eq: ['$userId', user._id] },
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
                  $gt: [{ $size: '$wishlist' }, 0],
                },
              },
            },
          ] : [
            {
              $addFields: {
                isSaved: false,
              },
            },
          ]),

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
          },
        ],
        totalCount: [
          { $count: 'count' },
        ],
      },
    });

    const result = await JobModule.aggregate(aggregationPipeline);

    const jobs = result[0]?.jobs || [];
    const total = result[0]?.totalCount[0]?.count || 0;

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

export const getSingleJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;

    const token = req.headers['authorization']?.split(' ')[1];

    let user;
    if (token) {
      user = await userAuth.findOne({ token }).select('_id');
    }

    const cacheKey = `job:${slug}:user:${user?._id || 'guest'}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return successResponse(res, cached, 200);
    }

    const job = await JobModule.findOne({ slug })
      .populate('createUserId', 'name email mobile')
      .lean();

    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }

    let isSaved = false;
    if (user?._id) {
      const saved = await wishlist.exists({
        userId: user._id,
        jobId: job._id,
      });
      console.log(saved)
      isSaved = !!saved;
    }

    const responseData = {
      ...job,
      isSaved,
    };

    cache.set(cacheKey, responseData);

    return successResponse(res, responseData, 200);
  } catch (error) {
    console.error('getSingleJobs error:', error);
    next(error);
  }
};

// export const getSingleJobs = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { slug } = req.params;

//     const token = req.headers['authorization']?.split(' ')[1];
//     let userId: string | null = null;

//     if (token) {
//       try {
//         const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
//         userId = decoded._id;
//       } catch (err) {
//         userId = null;
//       }
//     }

//     // 🧠 Build a unique cache key per job + user
//     const cacheKey = `job:${slug}:user:${userId || 'guest'}`;

//     const cached = cache.get(cacheKey);
//     if (cached) {
//       return successResponse(res, cached, 200);
//     }

//     const job = await JobModule.findOne({ slug })
//       .populate('createUserId', 'name email mobile')
//       .lean();

//     if (!job) {
//       return errorResponse(res, 'Job not found', 404);
//     }

//     let isSaved = false;

//     if (userId) {
//       const saved = await wishlist.exists({ userId, jobId: job._id });
//       isSaved = !!saved;
//     }

//     const responseData = { ...job, isSaved };

//     cache.set(cacheKey, responseData); // ✅ Cache result for this user + slug

//     return successResponse(res, responseData, 200);
//   } catch (error) {
//     next(error);
//   }
// };

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
