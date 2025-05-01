import { Router } from "express";
import { loginAdmin, verifyToken } from '../../controllers/admin.controller/auth.controller';

const router = Router();

router.post('/verify', verifyToken);
router.post('/login', loginAdmin);

export default router;    