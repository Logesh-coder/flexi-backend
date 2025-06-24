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

export const getJobCallsByUser = async (req: any, res: Response) => {
    try {
        const calls = await Call.find({ user: req.user._id, job: { $ne: null } })
            .populate('job')
            .sort({ createdAt: -1 });

        res.status(200).json(calls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch job call history' });
    }
};

export const getWorkerCallsByUser = async (req: any, res: Response) => {
    try {
        const calls = await Call.find({ user: req.user._id, worker: { $ne: null } })
            .populate('worker')
            .sort({ createdAt: -1 });

        res.status(200).json(calls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch worker call history' });
    }
};
