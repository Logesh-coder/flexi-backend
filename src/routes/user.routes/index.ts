import { Router } from 'express';
import { forgotPassword, getSingleWorker, getWorkers, loginUser, profile, profileEdit, registerUser, resetPassword, updatePssword, verifyToken } from "../../controllers/user.controller/auth.controller";
import { createJobForm, getJobs, getSingleJobs, updateJobForm } from '../../controllers/user.controller/job.controller';
import { addToWishlist, getWishlist, removeFromWishlist } from '../../controllers/user.controller/wishlist.controller';
import { authenticate } from '../../middleware/auth';
const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);
router.post('/verify-token', verifyToken);
router.get('/profile', authenticate, profile);
router.put('/edit-profile', authenticate, profileEdit);
router.put('/update-password', authenticate, updatePssword);
router.get('/workers', getWorkers);
router.get('/worker/:slug', getSingleWorker);

router.post('/job-add', authenticate, createJobForm);
router.get('/job', getJobs);
router.get('/job/:slug', getSingleJobs);
router.put('/job/:slug', authenticate, updateJobForm);

router.post("/addWishlist", authenticate, addToWishlist);
router.get("/wishlist", authenticate, getWishlist);
router.delete("/remove", authenticate, removeFromWishlist);

export default router;    