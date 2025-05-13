import { Router } from "express";
import { loginAdmin, verifyToken } from '../../controllers/admin.controller/auth.controller';
import { getWorkers } from "../../controllers/user.controller/auth.controller";
import { getJobs } from "../../controllers/user.controller/job.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.get('/verify', verifyToken);
router.post('/login', loginAdmin);
router.get('/workers', authenticate, getWorkers);
router.get('/job', authenticate, getJobs);

export default router;      