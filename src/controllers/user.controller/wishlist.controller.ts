import { NextFunction, Response } from "express";
import mongoose from "mongoose";
import { userWishlist, wishlist } from "../../models/user.models/wishlist";
import { errorResponse, successResponse } from "../../utils/response.util";
import { CustomRequest } from "./auth.controller";

// Add to Wishlist
export const addToWishlist = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { jobId } = req.body;

        const exists = await wishlist.findOne({ userId, jobId });

        if (exists) {
            return errorResponse(res, "Already in wishlist", 409);
        }

        const wishlistItem = await wishlist.create({ userId, jobId });

        return successResponse(res, wishlistItem, 201);
    } catch (error) {
        next(error);
    }
};

export const getWishlist = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?._id;
        const { page = 1, limit = 10, search = '' } = req.query;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const skip = (Number(page) - 1) * Number(limit);

        const wishlistItems = await wishlist.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: 'jobs', // collection name in MongoDB (case-sensitive)
                    localField: 'jobId',
                    foreignField: '_id',
                    as: 'jobDetails',
                },
            },
            {
                $unwind: '$jobDetails',
            },
            {
                $match: {
                    'jobDetails.title': {
                        $regex: search,
                        $options: 'i',
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    wishlistId: '$_id', // optional: include wishlist doc ID for delete
                    isSaved: { $literal: true }, // ✅ hardcoded true since it's in the wishlist
                    jobId: '$jobDetails._id',
                    title: '$jobDetails.title',
                    slug: '$jobDetails.slug',
                    budget: '$jobDetails.budget',
                    date: '$jobDetails.date',
                    durationStartTime: '$jobDetails.durationStartTime',
                    durationEndTime: '$jobDetails.durationEndTime',
                    area: '$jobDetails.area',
                    city: '$jobDetails.city',
                    landMark: '$jobDetails.landMark',
                    createUserId: '$jobDetails.createUserId',
                },
            },
            {
                $skip: skip,
            },
            {
                $limit: Number(limit),
            },
        ]);

        const totalItems = await wishlist.countDocuments({ userId });
        const totalPages = Math.ceil(totalItems / Number(limit));

        return successResponse(
            res,
            { wishlistItems, totalPages, page: Number(page) },
            200
        );
    } catch (error) {
        console.error('getWishlist error:', error);
        next(error);
    }
};

// Get Wishlist
// export const getWishlist = async (req: CustomRequest, res: Response, next: NextFunction) => {
//     try {
//         const userId = req.user?._id;
//         const { page = 1, limit = 10, search = '' } = req.query; // Page, limit, and search term from query parameters

//         const skip = (Number(page) - 1) * Number(limit);

//         const wishlistItems = await wishlist.aggregate([
//             {
//                 $match: { userId }, // Match the userId from the request
//             },
//             {
//                 $lookup: {
//                     from: 'jobs', // Name of the collection where jobs are stored
//                     localField: 'jobId', // The field in wishlist collection
//                     foreignField: '_id', // The field in the jobs collection
//                     as: 'jobDetails', // Output array with matched job details
//                 },
//             },
//             {
//                 $unwind: '$jobDetails', // Unwind the jobDetails array to flatten it
//             },
//             {
//                 $match: {
//                     'jobDetails.title': { $regex: search, $options: 'i' }, // Search for job titles (case-insensitive)
//                 },
//             },
//             {
//                 $project: {
//                     _id: 0, // Don't include the _id from wishlist, unless you want it
//                     jobId: '$jobDetails._id', // Include job _id
//                     title: '$jobDetails.title', // Include job title
//                     slug: '$jobDetails.slug', // Include job slug
//                     budget: '$jobDetails.budget', // Include job budget
//                     date: '$jobDetails.date', // Include job date
//                     durationStartTime: '$jobDetails.durationStartTime', // Include job start time
//                     durationEndTime: '$jobDetails.durationEndTime', // Include job end time
//                     area: '$jobDetails.area', // Include job area
//                     city: '$jobDetails.city', // Include job city
//                     landMark: '$jobDetails.landMark', // Include job landmark
//                     createUserId: '$jobDetails.createUserId', // Include the createUserId of the job
//                 },
//             },
//             {
//                 $skip: skip, // Skip the previous pages of results
//             },
//             {
//                 $limit: Number(limit), // Limit the number of results per page
//             },
//         ]);

//         const totalItems = await wishlist.countDocuments({ userId });
//         const totalPages = Math.ceil(totalItems / Number(limit));

//         return successResponse(res, { wishlistItems, totalPages }, 200);
//     } catch (error) {
//         next(error);
//     }
// };

// Remove from Wishlist
export const removeFromWishlist = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { jobId } = req.body;

        console.log('userId', userId)

        await wishlist.findOneAndDelete({ userId, jobId });

        return successResponse(res, "Removed from wishlist", 200);
    } catch (error) {
        next(error);
    }
};

export const addToWorkerWishlist = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { workerId } = req.body;

        const exists = await userWishlist.findOne({ userId, workerId });

        if (exists) {
            return errorResponse(res, "Already in worker wishlist", 409);
        }

        const wishlistItem = await userWishlist.create({ userId, workerId });

        return successResponse(res, wishlistItem, 201);
    } catch (error) {
        next(error);
    }
};

export const getWorkerWishlist = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user?._id);
        const { page = 1, limit = 10, search = '' } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        const wishlistItems = await userWishlist.aggregate([
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
                    isSaved: { $literal: true },
                },
            },
            {
                $skip: skip,
            },
            {
                $limit: Number(limit),
            },
        ]);

        const totalItems = await userWishlist.countDocuments({ userId });
        const totalPages = Math.ceil(totalItems / Number(limit));

        return successResponse(res, { wishlistItems, totalPages }, 200);
    } catch (error) {
        next(error);
    }
};

export const removeFromWorkerWishlist = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { workerId } = req.body;

        await userWishlist.findOneAndDelete({ userId, workerId });

        return successResponse(res, "Removed from worker wishlist", 200);
    } catch (error) {
        next(error);
    }
};