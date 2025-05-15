"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = __importDefault(require("./admin.routes/index"));
const index_2 = __importDefault(require("./user.routes/index"));
const router = (0, express_1.Router)();
router.use('/user', index_2.default);
router.use('/admin', index_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map