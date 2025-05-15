"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_model_1 = __importDefault(require("../models/user.models/auth.model"));
const response_util_1 = require("../utils/response.util");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new Error('Invalid or expired token');
    }
};
exports.verifyToken = verifyToken;
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return (0, response_util_1.errorResponse)(res, 'Authorization token is required', 400);
        }
        const user = await auth_model_1.default.findOne({ token: token });
        // let userId = user?._id;
        // if (!user) {
        //   user = await userAuth.findById(userId);
        //   if (!user) {
        //     return errorResponse(res, 'User not found', 401);
        //   }
        // }
        req.user = user;
        next();
    }
    catch (error) {
        return (0, response_util_1.errorResponse)(res, 'Invalid or expired token', 401);
    }
};
exports.authenticate = authenticate;
