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
const getJobCallsByUser = async (req, res) => {
    try {
        const calls = await call_1.default.find({ user: req.user._id, job: { $ne: null } })
            .populate('job')
            .sort({ createdAt: -1 });
        res.status(200).json(calls);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch job call history' });
    }
};
exports.getJobCallsByUser = getJobCallsByUser;
const getWorkerCallsByUser = async (req, res) => {
    try {
        const calls = await call_1.default.find({ user: req.user._id, worker: { $ne: null } })
            .populate('worker')
            .sort({ createdAt: -1 });
        res.status(200).json(calls);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch worker call history' });
    }
};
exports.getWorkerCallsByUser = getWorkerCallsByUser;
//# sourceMappingURL=call.controller.js.map