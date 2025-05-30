"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const helpSupportSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
}, { timestamps: true });
exports.default = mongoose_1.default.model("HelpSupport", helpSupportSchema);
//# sourceMappingURL=help.model.js.map