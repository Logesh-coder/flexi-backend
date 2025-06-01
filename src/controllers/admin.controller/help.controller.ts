import { NextFunction, Request, Response } from "express";
import HelpSupportModel from "../../models/admin.models/help.model";
import { errorResponse, successResponse } from "../../utils/response.util";

export const createHelpSupport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, mobile, subject, message } = req.body;

        // Validate input
        if (![name, mobile, subject, message].every(field => field && field.trim() !== '')) {
            return errorResponse(res, "All fields are required", 400);
        }

        // Create a new document instance
        const supportEntry = new HelpSupportModel({
            name,
            mobile,
            subject,
            message,
        });

        // Save to the database
        await supportEntry.save();

        return successResponse(res, supportEntry, 201);
    } catch (error) {
        next(error);
    }
};
// Get All Help & Support Entries
export const getAllHelpSupport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const search = req.query.search?.toString() || '';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Build search query
        const query = search
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { mobile: { $regex: search, $options: 'i' } },
                    { subject: { $regex: search, $options: 'i' } },
                    { message: { $regex: search, $options: 'i' } },
                ],
            }
            : {};

        const entries = await HelpSupportModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await HelpSupportModel.countDocuments(query);

        return successResponse(res, { data: entries, totalCount }, 200);
    } catch (error) {
        next(error);
    }
};