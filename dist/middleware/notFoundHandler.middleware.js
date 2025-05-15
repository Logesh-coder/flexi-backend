"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const response_util_1 = require("../utils/response.util");
const notFoundHandler = (req, res) => {
    return (0, response_util_1.errorResponse)(res, 'Route not found', 404);
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=notFoundHandler.middleware.js.map