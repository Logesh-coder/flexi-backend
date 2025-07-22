"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromWorkerWishlist = exports.getWorkerWishlist = exports.addToWorkerWishlist = exports.removeFromWishlist = exports.getWishlist = exports.addToWishlist = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const wishlist_1 = require("../../models/user.models/wishlist");
const response_util_1 = require("../../utils/response.util");
// Add to Wishlist
const addToWishlist = async (req, res, next) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { jobId } = req.body;
        const exists = await wishlist_1.wishlist.findOne({ userId, jobId });
        if (exists) {
            return (0, response_util_1.errorResponse)(res, "Already in wishlist", 409);
        }
        const wishlistItem = await wishlist_1.wishlist.create({ userId, jobId });
        return (0, response_util_1.successResponse)(res, wishlistItem, 201);
    }
    catch (error) {
        next(error);
    }
};
exports.addToWishlist = addToWishlist;
// Get Wishlist
const getWishlist = async (req, res, next) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { page = 1, limit = 10, search = '' } = req.query; // Page, limit, and search term from query parameters
        const skip = (Number(page) - 1) * Number(limit);
        const wishlistItems = await wishlist_1.wishlist.aggregate([
            {
                $match: { userId }, // Match the userId from the request
            },
            {
                $lookup: {
                    from: 'jobs', // Name of the collection where jobs are stored
                    localField: 'jobId', // The field in wishlist collection
                    foreignField: '_id', // The field in the jobs collection
                    as: 'jobDetails', // Output array with matched job details
                },
            },
            {
                $unwind: '$jobDetails', // Unwind the jobDetails array to flatten it
            },
            {
                $match: {
                    'jobDetails.title': { $regex: search, $options: 'i' }, // Search for job titles (case-insensitive)
                },
            },
            {
                $project: {
                    _id: 0, // Don't include the _id from wishlist, unless you want it
                    jobId: '$jobDetails._id', // Include job _id
                    title: '$jobDetails.title', // Include job title
                    slug: '$jobDetails.slug', // Include job slug
                    budget: '$jobDetails.budget', // Include job budget
                    date: '$jobDetails.date', // Include job date
                    durationStartTime: '$jobDetails.durationStartTime', // Include job start time
                    durationEndTime: '$jobDetails.durationEndTime', // Include job end time
                    area: '$jobDetails.area', // Include job area
                    city: '$jobDetails.city', // Include job city
                    landMark: '$jobDetails.landMark', // Include job landmark
                    createUserId: '$jobDetails.createUserId', // Include the createUserId of the job
                },
            },
            {
                $skip: skip, // Skip the previous pages of results
            },
            {
                $limit: Number(limit), // Limit the number of results per page
            },
        ]);
        const totalItems = await wishlist_1.wishlist.countDocuments({ userId });
        const totalPages = Math.ceil(totalItems / Number(limit));
        return (0, response_util_1.successResponse)(res, { wishlistItems, totalPages }, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.getWishlist = getWishlist;
// Remove from Wishlist
const removeFromWishlist = async (req, res, next) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { jobId } = req.body;
        console.log('userId', userId);
        await wishlist_1.wishlist.findOneAndDelete({ userId, jobId });
        return (0, response_util_1.successResponse)(res, "Removed from wishlist", 200);
    }
    catch (error) {
        next(error);
    }
};
exports.removeFromWishlist = removeFromWishlist;
const addToWorkerWishlist = async (req, res, next) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { workerId } = req.body;
        console.log('userId', userId);
        const exists = await wishlist_1.userWishlist.findOne({ userId, workerId });
        if (exists) {
            return (0, response_util_1.errorResponse)(res, "Already in worker wishlist", 409);
        }
        const wishlistItem = await wishlist_1.userWishlist.create({ userId, workerId });
        return (0, response_util_1.successResponse)(res, wishlistItem, 201);
    }
    catch (error) {
        next(error);
    }
};
exports.addToWorkerWishlist = addToWorkerWishlist;
const getWorkerWishlist = async (req, res, next) => {
    var _a;
    try {
        const userId = new mongoose_1.default.Types.ObjectId((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const wishlistItems = await wishlist_1.userWishlist.aggregate([
            {
                $match: { userId },
            },
            {
                $lookup: {
                    from: 'userauthregisters',
                    localField: 'workerId',
                    foreignField: '_id',
                    as: 'workerDetails',
                },
            },
            { $unwind: '$workerDetails' },
            {
                $match: {
                    'workerDetails.name': { $regex: search, $options: 'i' },
                },
            },
            {
                $project: {
                    _id: 0,
                    workerId: '$workerDetails._id',
                    name: '$workerDetails.name',
                    area: '$workerDetails.area',
                    city: '$workerDetails.city',
                    slug: '$workerDetails.slug',
                    salary: '$workerDetails.salary',
                    domain: '$workerDetails.domain',
                },
            },
            {
                $skip: skip,
            },
            {
                $limit: Number(limit),
            },
        ]);
        const totalItems = await wishlist_1.userWishlist.countDocuments({ userId });
        const totalPages = Math.ceil(totalItems / Number(limit));
        return (0, response_util_1.successResponse)(res, { wishlistItems, totalPages }, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.getWorkerWishlist = getWorkerWishlist;
const removeFromWorkerWishlist = async (req, res, next) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { workerId } = req.body;
        await wishlist_1.userWishlist.findOneAndDelete({ userId, workerId });
        return (0, response_util_1.successResponse)(res, "Removed from worker wishlist", 200);
    }
    catch (error) {
        next(error);
    }
};
exports.removeFromWorkerWishlist = removeFromWorkerWishlist;
//# sourceMappingURL=wishlist.controller.js.map