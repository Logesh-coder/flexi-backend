import { Router } from "express";
import { loginAdmin, verifyToken } from '../../controllers/admin.controller/auth.controller';
import { createLocationWithAreas, deleteLocation, editLocation, getAllLocations } from "../../controllers/admin.controller/location.controller";
import { getWorkers } from "../../controllers/user.controller/auth.controller";
import { getJobs } from "../../controllers/user.controller/job.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.get('/verify', verifyToken);
router.post('/login', loginAdmin);
router.get('/workers', authenticate, getWorkers);
router.get('/job', authenticate, getJobs);
router.post('/add-location', authenticate, createLocationWithAreas);
router.get('/location', authenticate, getAllLocations);
router.put('/location/:cityId', authenticate, editLocation);
router.delete('/location/:cityId', authenticate, deleteLocation);

export default router;      