"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../../controllers/admin.controller/auth.controller");
const location_controller_1 = require("../../controllers/admin.controller/location.controller");
const auth_controller_2 = require("../../controllers/user.controller/auth.controller");
const job_controller_1 = require("../../controllers/user.controller/job.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.get('/verify', auth_controller_1.verifyToken);
router.post('/login', auth_controller_1.loginAdmin);
router.get('/workers', auth_1.authenticate, auth_controller_2.getWorkers);
router.get('/job', auth_1.authenticate, job_controller_1.getJobs);
router.post('/add-location', auth_1.authenticate, location_controller_1.createLocationWithAreas);
router.get('/location', auth_1.authenticate, location_controller_1.getAllLocations);
router.put('/location/:cityId', auth_1.authenticate, location_controller_1.editLocation);
router.delete('/location/:cityId', auth_1.authenticate, location_controller_1.deleteLocation);
exports.default = router;
//# sourceMappingURL=index.js.map