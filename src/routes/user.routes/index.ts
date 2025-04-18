import { Router } from 'express';
import { forgotPassword, loginUser, profile, profileEdit, registerUser, resetPassword, verifyToken } from "../../controllers/user.controller/auth.controller";
import { createJobForm, getJobs, getSingleJobs, userApplyJobForm } from '../../controllers/user.controller/job.controller';
import { authenticate } from '../../middleware/auth';
const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-token', verifyToken);
router.get('/profile', authenticate, profile);
router.put('/edit-profile', authenticate, profileEdit);

router.post('/job-add', authenticate, createJobForm);
router.get('/job', getJobs);
router.get('/job/:slug', getSingleJobs);
router.post('/job-apply', authenticate, userApplyJobForm);

export default router;    