"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.City = exports.Area = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const citySchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, 'Please enter city name'],
        unique: true,
        trim: true,
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
const City = mongoose_1.default.model('City', citySchema);
exports.City = City;
const areaSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, 'Please enter area name'],
        trim: true,
    },
    city: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'City',
        required: [true, 'City reference is required'],
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
const Area = mongoose_1.default.model('Area', areaSchema);
exports.Area = Area;
//# sourceMappingURL=location.model.js.map