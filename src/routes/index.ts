import { Router } from 'express';
import adminRoutes from './admin.routes/index';
import userRoutes from './user.routes/index';

const router = Router();

router.use('/user', userRoutes);
router.use('/admin', adminRoutes);

export default router;