import { Response } from 'express';
import Call from '../../models/user.models/call';

export const createCall = async (req: any, res: Response) => {
    try {
        const userId = req.user?._id;
        const { job, worker } = req.body;

        if (!job && !worker) {
            return res.status(400).json({ error: 'jobId or workerId is required' });
        }

        const call = new Call({
            user: userId,
            job: job || null,
            worker: worker || null,
            via: job ? 'job' : 'worker',
        });

        await call.save();
        res.status(201).json({ message: 'Call tracked successfully', call });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// controllers/call.controller.ts

export const getJobCallsByUser = async (req: any, res: Response) => {
    try {
        // 1) parse page & limit (fallback to page 1, limit 10)
        const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
        const skip = (page - 1) * limit;

        // 2) fetch total count
        const totalCount = await Call.countDocuments({
            user: req.user._id,
            job: { $ne: null }
        });

        // 3) fetch this page
        const calls = await Call.find({ user: req.user._id, job: { $ne: null } })
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
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch job call history' });
    }
};

export const getWorkerCallsByUser = async (req: any, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
        const skip = (page - 1) * limit;

        const totalCount = await Call.countDocuments({
            user: req.user._id,
            worker: { $ne: null }
        });

        const calls = await Call.find({ user: req.user._id, worker: { $ne: null } })
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
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch worker call history' });
    }
};
