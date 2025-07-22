"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateJobForm = exports.getSingleJobs = exports.getJobs = exports.createJobForm = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_model_1 = __importDefault(require("../../models/user.models/auth.model"));
const job_model_1 = __importDefault(require("../../models/user.models/job.model"));
const wishlist_1 = require("../../models/user.models/wishlist");
const cache_1 = __importDefault(require("../../utils/cache"));
const response_util_1 = require("../../utils/response.util");
const createJobForm = async (req, res, next) => {
    var _a, _b;
    try {
        const { title, description, budget, date, durationStartTime, durationEndTime, area, city, landMark, contact } = req.body;
        const isActive = (_a = req.user) === null || _a === void 0 ? void 0 : _a.isActive;
        const createUserId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        if (!isActive) {
            return (0, response_util_1.errorResponse)(res, 'Your profile is not active. Please activate your account.', 500);
        }
        const formattedDate = (() => {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        })();
        const generateSlug = (text) => {
            return text
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        };
        const slug = generateSlug(title);
        const newJob = new job_model_1.default({
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
        return (0, response_util_1.successResponse)(res, newJob, 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createJobForm = createJobForm;
// export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const {
//       area,
//       city,
//       minBudget,
//       maxBudget,
//       search,
//       date,
//       id,
//       page = 1,
//       limit = 10,
//     } = req.query;
//     const token = req.headers['authorization']?.split(' ')[1];
//     let user;
//     if (token) {
//       user = await userAuth.findOne({ token }).select('_id');
//     }
//     const filters: any = {};
//     if (id === 'true') filters.createUserId = user?._id;
//     if (area) filters.area = area;
//     if (city) filters.city = city;
//     if (date) filters.date = date;
//     if (minBudget || maxBudget) {
//       filters.budget = {};
//       if (minBudget) filters.budget.$gte = Number(minBudget);
//       if (maxBudget) filters.budget.$lte = Number(maxBudget);
//     }
//     const skip = (Number(page) - 1) * Number(limit);
//     const aggregationPipeline: any[] = [];
//     if (search) {
//       aggregationPipeline.push({
//         $search: {
//           index: 'jobSearchIndex',
//           text: {
//             query: search,
//             path: 'title',
//             fuzzy: {
//               maxEdits: 2,
//               prefixLength: 100,
//             },
//           },
//         },
//       });
//       // You can still apply filters after search
//       aggregationPipeline.push({ $match: filters });
//     } else {
//       aggregationPipeline.push({ $match: filters });
//     }
//     aggregationPipeline.push(
//       { $sort: { createdAt: -1 } },
//       { $skip: skip },
//       { $limit: Number(limit) },
//       {
//         $lookup: {
//           from: 'wishlists',
//           let: { jobId: '$_id' },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ['$jobId', '$$jobId'] },
//                     { $eq: ['$userId', user?._id] },
//                   ],
//                 },
//               },
//             },
//           ],
//           as: 'wishlist',
//         },
//       },
//       {
//         $addFields: {
//           isSaved: {
//             $cond: {
//               if: { $gt: [{ $size: '$wishlist' }, 0] },
//               then: true,
//               else: false,
//             },
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: 'userauthregisters',
//           let: { userId: '$createUserId' },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ['$_id', '$$userId'] },
//               },
//             },
//             {
//               $project: {
//                 _id: 0,
//                 mobile: 1,
//               },
//             },
//           ],
//           as: 'createUser',
//         },
//       },
//       {
//         $unwind: {
//           path: '$createUser',
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $project: {
//           wishlist: 0,
//         },
//       }
//     );
//     const jobs = await JobModule.aggregate(aggregationPipeline);
//     // For search, we can't use countDocuments directly
//     const total = search
//       ? jobs.length // Approximate, since we can't use $count after $search easily
//       : await JobModule.countDocuments(filters);
//     return successResponse(res, {
//       jobs,
//       total,
//       page: Number(page),
//       pages: Math.ceil(total / Number(limit)),
//     }, 200);
//   } catch (error) {
//     next(error);
//   }
// };
const getJobs = async (req, res, next) => {
    var _a, _b, _c, _d;
    try {
        const { area, city, minBudget, maxBudget, search, date, id, page = 1, limit = 10, } = req.query;
        const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        let user;
        if (token) {
            user = await auth_model_1.default.findOne({ token }).select('_id');
        }
        console.log('user', user === null || user === void 0 ? void 0 : user._id);
        const filters = {};
        // if (id === 'true' && userId) filters.createUserId = userId;
        if (id === 'true' && (user === null || user === void 0 ? void 0 : user._id)) {
            filters.createUserId = new mongoose_1.default.Types.ObjectId(user._id);
        }
        if (area)
            filters.area = area;
        if (city)
            filters.city = city;
        if (date)
            filters.date = date;
        if (minBudget || maxBudget) {
            filters.budget = {};
            if (minBudget)
                filters.budget.$gte = Number(minBudget);
            if (maxBudget)
                filters.budget.$lte = Number(maxBudget);
        }
        const skip = (Number(page) - 1) * Number(limit);
        const aggregationPipeline = [];
        if (search) {
            aggregationPipeline.push({
                $search: {
                    index: 'jobSearchIndex',
                    text: {
                        query: search,
                        path: 'title',
                        fuzzy: {
                            maxEdits: 1,
                            prefixLength: 2,
                        },
                    },
                },
            });
            aggregationPipeline.push({ $match: filters });
        }
        else {
            aggregationPipeline.push({ $match: filters });
        }
        aggregationPipeline.push({
            $facet: {
                jobs: [
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: Number(limit) },
                    // ✅ Conditional $lookup if user is logged in
                    ...((user === null || user === void 0 ? void 0 : user._id) ? [
                        {
                            $lookup: {
                                from: 'Wishlist',
                                let: { jobId: '$_id' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$jobId', '$$jobId'] },
                                                    { $eq: ['$userId', user === null || user === void 0 ? void 0 : user._id] }, // ✅ direct value comparison
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
                        }
                    ] : [
                        {
                            $addFields: {
                                isSaved: false,
                            },
                        }
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
                            wishlist: 0, // remove internal field
                        },
                    },
                ],
                totalCount: [
                    { $count: 'count' },
                ],
            },
        });
        const result = await job_model_1.default.aggregate(aggregationPipeline);
        const jobs = ((_b = result[0]) === null || _b === void 0 ? void 0 : _b.jobs) || [];
        const total = ((_d = (_c = result[0]) === null || _c === void 0 ? void 0 : _c.totalCount[0]) === null || _d === void 0 ? void 0 : _d.count) || 0;
        console.log('jobs', jobs);
        return (0, response_util_1.successResponse)(res, {
            jobs,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
        }, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.getJobs = getJobs;
const getSingleJobs = async (req, res, next) => {
    var _a;
    try {
        const { slug } = req.params;
        const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        let userId = null;
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                userId = decoded._id;
            }
            catch (err) {
                userId = null;
            }
        }
        // 🧠 Build a unique cache key per job + user
        const cacheKey = `job:${slug}:user:${userId || 'guest'}`;
        const cached = cache_1.default.get(cacheKey);
        if (cached) {
            return (0, response_util_1.successResponse)(res, cached, 200);
        }
        const job = await job_model_1.default.findOne({ slug })
            .populate('createUserId', 'name email mobile')
            .lean();
        if (!job) {
            return (0, response_util_1.errorResponse)(res, 'Job not found', 404);
        }
        let isSaved = false;
        if (userId) {
            const saved = await wishlist_1.wishlist.exists({ userId, jobId: job._id });
            isSaved = !!saved;
        }
        const responseData = Object.assign(Object.assign({}, job), { isSaved });
        cache_1.default.set(cacheKey, responseData); // ✅ Cache result for this user + slug
        return (0, response_util_1.successResponse)(res, responseData, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.getSingleJobs = getSingleJobs;
// export const getSingleJobs = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { slug } = req.params;
//     const job = await JobModule.findOne({ slug }).populate('createUserId', 'name email mobile ').lean();
//     if (!job) {
//       errorResponse(res, 'Job not found', 404);
//     }
//     const token = req.headers['authorization']?.split(' ')[1];
//     let isSaved = false;
//     if (token) {
//       const user = await userAuth.findOne({ token }).select('_id');
//       if (user) {
//         const saved = await wishlist.exists({ userId: user._id, jobId: job._id });
//         isSaved = !!saved;
//       }
//     }
//     return successResponse(res, { ...job, isSaved }, 200);
//   } catch (error) {
//     next(error)
//   }
// };
const updateJobForm = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { title, description, budget, date, durationStartTime, durationEndTime, area, city, landMark } = req.body;
        const formattedDate = (() => {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        })();
        const generateSlug = (text) => {
            return text
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        };
        const updatedSlug = generateSlug(title);
        const updatedJob = await job_model_1.default.findOneAndUpdate({ slug }, {
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
        }, { new: true } // return the updated document
        );
        if (!updatedJob) {
            return res.status(404).json({ message: 'Job not found' });
        }
        return (0, response_util_1.successResponse)(res, updatedJob, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.updateJobForm = updateJobForm;
//# sourceMappingURL=job.controller.js.map