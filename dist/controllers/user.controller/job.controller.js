"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusToggle = exports.updateJobForm = exports.getSingleJobs = exports.getJobs = exports.createJobForm = void 0;
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
        const generateUniqueSlug = async (title) => {
            let baseSlug = title
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            let slug = baseSlug;
            let counter = 1;
            // Check for slug existence
            while (await job_model_1.default.findOne({ slug })) {
                slug = `${baseSlug}-${counter++}`;
            }
            return slug;
        };
        const slug = await generateUniqueSlug(title);
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
const getJobs = async (req, res, next) => {
    var _a, _b, _c, _d;
    try {
        const { area, city, minBudget, maxBudget, search, date, id, page = 1, limit = 10, } = req.query;
        const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        let user;
        if (token) {
            user = await auth_model_1.default.findOne({ token }).select('_id');
        }
        const filters = {};
        if (!req.baseUrl.includes('/admin')) {
            filters.isActive = true;
        }
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
        // 🔍 Add Atlas Search logic with compound filters
        if (search) {
            const filterConditions = [];
            if (area)
                filterConditions.push({ equals: { path: 'area', value: area } });
            if (city)
                filterConditions.push({ equals: { path: 'city', value: city } });
            if (date)
                filterConditions.push({ equals: { path: 'date', value: date } });
            if (minBudget || maxBudget) {
                const range = { path: 'budget' };
                if (minBudget)
                    range.gte = Number(minBudget);
                if (maxBudget)
                    range.lte = Number(maxBudget);
                filterConditions.push({ range });
            }
            if (id === 'true' && (user === null || user === void 0 ? void 0 : user._id)) {
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
        }
        else {
            aggregationPipeline.push({ $match: filters });
        }
        // 📦 Facet Pipeline
        aggregationPipeline.push({
            $facet: {
                jobs: [
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: Number(limit) },
                    ...((user === null || user === void 0 ? void 0 : user._id) ? [
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
        const result = await job_model_1.default.aggregate(aggregationPipeline);
        const jobs = ((_b = result[0]) === null || _b === void 0 ? void 0 : _b.jobs) || [];
        const total = ((_d = (_c = result[0]) === null || _c === void 0 ? void 0 : _c.totalCount[0]) === null || _d === void 0 ? void 0 : _d.count) || 0;
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
        let user;
        if (token) {
            user = await auth_model_1.default.findOne({ token }).select('_id');
        }
        const cacheKey = `job:${slug}:user:${(user === null || user === void 0 ? void 0 : user._id) || 'guest'}`;
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
        if (user === null || user === void 0 ? void 0 : user._id) {
            const saved = await wishlist_1.wishlist.exists({
                userId: user._id,
                jobId: job._id,
            });
            console.log(saved);
            isSaved = !!saved;
        }
        const responseData = Object.assign(Object.assign({}, job), { isSaved });
        cache_1.default.set(cacheKey, responseData);
        return (0, response_util_1.successResponse)(res, responseData, 200);
    }
    catch (error) {
        console.error('getSingleJobs error:', error);
        next(error);
    }
};
exports.getSingleJobs = getSingleJobs;
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
const statusToggle = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const job = await job_model_1.default.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        job.isActive = !job.isActive;
        await job.save();
        return res.status(200).json({
            message: `Job status changed to ${job.isActive ? 'active' : 'inactive'}`,
            updatedJob: job
        });
    }
    catch (error) {
        next(error);
    }
};
exports.statusToggle = statusToggle;
//# sourceMappingURL=job.controller.js.map