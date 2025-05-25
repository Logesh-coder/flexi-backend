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
        const authHeader = req.headers['authorization'];
        const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(' ')[1];
        if (!token) {
            return (0, response_util_1.errorResponse)(res, 'Authorization token is required', 401);
        }
        const user = await auth_model_1.default.findOne({ token });
        if (!user) {
            return (0, response_util_1.errorResponse)(res, 'Invalid token', 401);
        }
        // Optional: assuming you store token expiry as a Date in user.tokenExpiry
        if (user.tokenExpiry && new Date(user.tokenExpiry) < new Date()) {
            return (0, response_util_1.errorResponse)(res, 'Token expired', 40);
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Auth error:', error);
        return (0, response_util_1.errorResponse)(res, 'Authentication failed', 401);
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.js.map