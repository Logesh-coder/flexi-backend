import { Router } from "express";
import { loginAdmin, verifyToken } from '../../controllers/admin.controller/auth.controller';
import { getAllHelpSupport } from "../../controllers/admin.controller/help.controller";
import { createLocationWithAreas, deleteLocation, editLocation, getAllLocations } from "../../controllers/admin.controller/location.controller";
import { getWorkers, inActiveUser } from "../../controllers/user.controller/auth.controller";
import { getJobs } from "../../controllers/user.controller/job.controller";
import { adminAuthenticate } from "../../middleware/auth";

const router = Router();

router.get('/verify', verifyToken);
router.post('/login', loginAdmin);
router.get('/workers', adminAuthenticate, getWorkers);
router.get('/job', adminAuthenticate, getJobs);
router.post('/add-location', adminAuthenticate, createLocationWithAreas);
router.get('/location', adminAuthenticate, getAllLocations);
router.put('/location/:cityId', adminAuthenticate, editLocation);
router.delete('/location/:cityId', adminAuthenticate, deleteLocation);
router.get('/help-support', adminAuthenticate, getAllHelpSupport);
router.patch('/inActive/:id', adminAuthenticate, inActiveUser);

export default router; 