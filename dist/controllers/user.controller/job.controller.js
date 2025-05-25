"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateJobForm = exports.getSingleJobs = exports.getJobs = exports.createJobForm = void 0;
const auth_model_1 = __importDefault(require("../../models/user.models/auth.model"));
const job_model_1 = __importDefault(require("../../models/user.models/job.model"));
const wishlist_1 = require("../../models/user.models/wishlist");
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
const getJobs = async (req, res, next) => {
    var _a;
    try {
        const { area, city, minBudget, maxBudget, search, date, id, page = 1, limit = 10, } = req.query;
        const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        let user;
        if (token) {
            user = await auth_model_1.default.findOne({ token }).select('_id');
        }
        const filters = {};
        if (id === 'true')
            filters.createUserId = user === null || user === void 0 ? void 0 : user._id;
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
                            maxEdits: 2,
                            prefixLength: 100,
                        },
                    },
                },
            });
            // You can still apply filters after search
            aggregationPipeline.push({ $match: filters });
        }
        else {
            aggregationPipeline.push({ $match: filters });
        }
        aggregationPipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: Number(limit) }, {
            $lookup: {
                from: 'wishlists',
                let: { jobId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$jobId', '$$jobId'] },
                                    { $eq: ['$userId', user === null || user === void 0 ? void 0 : user._id] },
                                ],
                            },
                        },
                    },
                ],
                as: 'wishlist',
            },
        }, {
            $addFields: {
                isSaved: {
                    $cond: {
                        if: { $gt: [{ $size: '$wishlist' }, 0] },
                        then: true,
                        else: false,
                    },
                },
            },
        }, {
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
        }, {
            $unwind: {
                path: '$createUser',
                preserveNullAndEmptyArrays: true,
            },
        }, {
            $project: {
                wishlist: 0,
            },
        });
        const jobs = await job_model_1.default.aggregate(aggregationPipeline);
        // For search, we can't use countDocuments directly
        const total = search
            ? jobs.length // Approximate, since we can't use $count after $search easily
            : await job_model_1.default.countDocuments(filters);
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
        const job = await job_model_1.default.findOne({ slug }).populate('createUserId', 'name email mobile ').lean();
        if (!job) {
            (0, response_util_1.errorResponse)(res, 'Job not found', 404);
        }
        const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        let isSaved = false;
        if (token) {
            const user = await auth_model_1.default.findOne({ token }).select('_id');
            if (user) {
                const saved = await wishlist_1.wishlist.exists({ userId: user._id, jobId: job._id });
                isSaved = !!saved;
            }
        }
        return (0, response_util_1.successResponse)(res, Object.assign(Object.assign({}, job), { isSaved }), 200);
    }
    catch (error) {
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
//# sourceMappingURL=job.controller.js.map