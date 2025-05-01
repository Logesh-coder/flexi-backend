import { Router } from 'express';
import userAuthRoutes from './user.routes/index';

const router = Router();

router.use('/user', userAuthRoutes);

export default router;