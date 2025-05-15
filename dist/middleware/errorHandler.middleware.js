"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = __importDefault(require("../config/logger"));
const response_util_1 = require("../utils/response.util");
const errorHandler = (err, req, res, next) => {
    logger_1.default.error(`Error on ${req.method} ${req.url}`, {
        message: err.message,
        stack: err.stack,
    });
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';
    const data = err.data || null;
    return (0, response_util_1.errorResponse)(res, message, statusCode, data);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.middleware.js.map