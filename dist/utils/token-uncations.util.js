"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_model_1 = __importDefault(require("../models/user.models/auth.model"));
const findUserByToken = async (token) => {
    try {
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY);
        }
        catch (err) {
            console.error("JWT verification failed:", err);
            return {
                success: false,
                message: "Invalid or expired token"
            };
        }
        const user = await auth_model_1.default.findOne({ _id: decoded.userId });
        if (!user) {
            return {
                success: false,
                message: "User not found"
            };
        }
        return {
            success: true,
            user
        };
    }
    catch (error) {
        return {
            success: false,
            message: "An error occurred while verifying user",
        };
    }
};
exports.default = findUserByToken;
//# sourceMappingURL=token-uncations.util.js.map