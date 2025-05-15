"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const winston_1 = __importDefault(require("winston"));
const isProduction = process.env.NODE_ENV === 'production';
const logDir = path_1.default.join(__dirname, '../../logs');
const transports = [];
// File logging only in development
if (!isProduction) {
    // Ensure the 'logs' directory exists
    if (!fs_1.default.existsSync(logDir)) {
        fs_1.default.mkdirSync(logDir, { recursive: true });
    }
    transports.push(new winston_1.default.transports.File({ filename: path_1.default.join(logDir, 'error.log'), level: 'error' }), new winston_1.default.transports.File({ filename: path_1.default.join(logDir, 'combined.log') }));
}
// Always log to console (Vercel captures this)
transports.push(new winston_1.default.transports.Console({
    format: isProduction ? winston_1.default.format.json() : winston_1.default.format.simple(),
}));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports,
});
exports.default = logger;
