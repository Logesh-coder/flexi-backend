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
export const getAllHelpSupport = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const entries = await HelpSupportModel.find().sort({ createdAt: -1 });

        return successResponse(res, entries, 200);
    } catch (error) {
        next(error);
    }
};