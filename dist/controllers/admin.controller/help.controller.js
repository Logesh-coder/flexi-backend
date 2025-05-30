"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllHelpSupport = exports.createHelpSupport = void 0;
const help_model_1 = __importDefault(require("../../models/admin.models/help.model"));
const response_util_1 = require("../../utils/response.util");
const createHelpSupport = async (req, res, next) => {
    try {
        const { name, mobile, subject, message } = req.body;
        // Validate input
        if (![name, mobile, subject, message].every(field => field && field.trim() !== '')) {
            return (0, response_util_1.errorResponse)(res, "All fields are required", 400);
        }
        // Create a new document instance
        const supportEntry = new help_model_1.default({
            name,
            mobile,
            subject,
            message,
        });
        // Save to the database
        await supportEntry.save();
        return (0, response_util_1.successResponse)(res, supportEntry, 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createHelpSupport = createHelpSupport;
// Get All Help & Support Entries
const getAllHelpSupport = async (_req, res, next) => {
    try {
        const entries = await help_model_1.default.find().sort({ createdAt: -1 });
        return (0, response_util_1.successResponse)(res, entries, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllHelpSupport = getAllHelpSupport;
//# sourceMappingURL=help.controller.js.map