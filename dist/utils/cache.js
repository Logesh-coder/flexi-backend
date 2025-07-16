"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({
    stdTTL: 60, // cache TTL in seconds (e.g., 60s)
    checkperiod: 120, // how often to check for expired keys
});
exports.default = cache;
//# sourceMappingURL=cache.js.map