"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({
        status: 'success',
        data,
    });
};
exports.successResponse = successResponse;
const errorResponse = (res, message = '', statusCode = 500, data) => {
    const response = {
        status: 'error',
        message,
        ...(data && { data }),
    };
    return res.status(statusCode).json(response);
};
exports.errorResponse = errorResponse;
