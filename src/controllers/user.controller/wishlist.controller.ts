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

        const wishlistItem = await wishlist.find({ userId }).populate("jobId");

        return successResponse(res, wishlistItem, 200);
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
