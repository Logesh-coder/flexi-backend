"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkerCallsByUser = exports.getJobCallsByUser = exports.createCall = void 0;
const call_1 = __importDefault(require("../../models/user.models/call"));
const createCall = async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { job, worker } = req.body;
        if (!job && !worker) {
            return res.status(400).json({ error: 'jobId or workerId is required' });
        }
        const call = new call_1.default({
            user: userId,
            job: job || null,
            worker: worker || null,
            via: job ? 'job' : 'worker',
        });
        await call.save();
        res.status(201).json({ message: 'Call tracked successfully', call });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createCall = createCall;
// controllers/call.controller.ts
const getJobCallsByUser = async (req, res) => {
    try {
        // 1) parse page & limit (fallback to page 1, limit 10)
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
        const skip = (page - 1) * limit;
        // 2) fetch total count
        const totalCount = await call_1.default.countDocuments({
            user: req.user._id,
            job: { $ne: null }
        });
        // 3) fetch this page
        const calls = await call_1.default.find({ user: req.user._id, job: { $ne: null } })
            .populate('job')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        // 4) compute pagination metadata
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        // 5) send back structured payload
        res.status(200).json({
            data: calls,
            page,
            totalPages,
            hasNextPage,
            nextPage: hasNextPage ? page + 1 : null
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch job call history' });
    }
};
exports.getJobCallsByUser = getJobCallsByUser;
const getWorkerCallsByUser = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
        const skip = (page - 1) * limit;
        const totalCount = await call_1.default.countDocuments({
            user: req.user._id,
            worker: { $ne: null }
        });
        const calls = await call_1.default.find({ user: req.user._id, worker: { $ne: null } })
            .populate('worker')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        res.status(200).json({
            data: calls,
            page,
            totalPages,
            hasNextPage,
            nextPage: hasNextPage ? page + 1 : null
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch worker call history' });
    }
};
exports.getWorkerCallsByUser = getWorkerCallsByUser;
//# sourceMappingURL=call.controller.js.map