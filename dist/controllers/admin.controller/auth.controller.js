"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.loginAdmin = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_model_1 = __importDefault(require("../../models/admin.models/auth.model"));
const response_util_1 = require("../../utils/response.util");
const response_util_2 = require("./../../utils/response.util");
const loginAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const adminLogin = await auth_model_1.default.findOne({ email });
        if (!adminLogin) {
            return (0, response_util_2.errorResponse)(res, 'Please enter a email or password', 401);
        }
        const isPasswordMatch = await bcrypt_1.default.compare(password, adminLogin.password);
        if (!isPasswordMatch) {
            return (0, response_util_2.errorResponse)(res, 'Invalid email or password', 400);
        }
        const token = jsonwebtoken_1.default.sign({ userId: adminLogin._id, email: adminLogin.email }, process.env.SECRET_KEY, { expiresIn: "8h" });
        adminLogin.token = token;
        await adminLogin.save();
        return (0, response_util_1.successResponse)(res, token, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.loginAdmin = loginAdmin;
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return (0, response_util_2.errorResponse)(res, 'Authorization header with Bearer token is required', 400);
        }
        const token = authHeader.split(" ")[1];
        const admin = await auth_model_1.default.findOne({ token });
        if (!admin) {
            return res.status(400).json({
                success: false,
                message: "Admin not found",
            });
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY);
        }
        catch (err) {
            return (0, response_util_2.errorResponse)(res, 'Invalid or expired token', 400);
        }
        (0, response_util_1.successResponse)(res, 'Token is valid', 200);
    }
    catch (error) {
        next(error);
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=auth.controller.js.map