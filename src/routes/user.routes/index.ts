import { Router } from 'express';
import { createHelpSupport } from "../../controllers/admin.controller/help.controller";
import { getAllLocations } from "../../controllers/admin.controller/location.controller";
import { forgotPassword, getSingleWorker, getWorkers, handleGoogleCallback, loginUser, profile, profileEdit, registerUser, resetPassword, updatePssword, verifyToken } from "../../controllers/user.controller/auth.controller";
import { createJobForm, getJobs, getSingleJobs, updateJobForm } from '../../controllers/user.controller/job.controller';
import { addToWishlist, addToWorkerWishlist, getWishlist, getWorkerWishlist, removeFromWishlist, removeFromWorkerWishlist } from '../../controllers/user.controller/wishlist.controller';
import { authenticate } from '../../middleware/auth';


const router = Router();


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

router.get('/google', (_req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=email profile&access_type=offline`;
    res.redirect(url);
});

router.get('/google/callback', handleGoogleCallback);

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

router.post("/addWishlist-worker", authenticate, addToWorkerWishlist);
router.get("/wishlist-worker", authenticate, getWorkerWishlist);
router.delete("/remove-worker", authenticate, removeFromWorkerWishlist);

router.get('/location', getAllLocations);
router.post('/help-support', createHelpSupport);

export default router;    