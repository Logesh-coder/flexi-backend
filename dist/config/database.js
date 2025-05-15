"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("./logger"));
const connectDB = async () => {
    console.log("db");
    try {
        const mongoURI = process.env.MONGODB_URI;
        await mongoose_1.default.connect(mongoURI);
        logger_1.default.info('MongoDB connected successfully');
    }
    catch (error) {
        logger_1.default.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.disconnect();
        logger_1.default.info('MongoDB disconnected successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to disconnect MongoDB', { error });
    }
};
exports.disconnectDB = disconnectDB;
//# sourceMappingURL=database.js.map