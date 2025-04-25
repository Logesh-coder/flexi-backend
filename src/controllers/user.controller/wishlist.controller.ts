import { NextFunction, Response } from "express";
import wishlist from "../../models/user.models/wishlist";
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

// Get Wishlist
export const getWishlist = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { page = 1, limit = 10, search = '' } = req.query; // Page, limit, and search term from query parameters

        const skip = (Number(page) - 1) * Number(limit);

        const wishlistItems = await wishlist.aggregate([
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

        const totalItems = await wishlist.countDocuments({ userId });
        const totalPages = Math.ceil(totalItems / Number(limit));

        return successResponse(res, { wishlistItems, totalPages }, 200);
    } catch (error) {
        next(error);
    }
};

// Remove from Wishlist
export const removeFromWishlist = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const { jobId } = req.body;

        await wishlist.findOneAndDelete({ userId, jobId });

        return successResponse(res, "Removed from wishlist", 200);
    } catch (error) {
        next(error);
    }
};
