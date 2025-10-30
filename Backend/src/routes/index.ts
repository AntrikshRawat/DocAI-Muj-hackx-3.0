import { Router } from 'express';
import authRoutes from './authRoutes';

const router = Router();

// Welcome route
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to CB Backend API',
    version: '1.0.0',
  });
});

// Route modules
router.use('/auth', authRoutes);

export default router;
