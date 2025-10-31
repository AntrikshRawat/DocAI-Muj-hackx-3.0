import { Router } from 'express';
import authRoutes from './authRoutes';
import chatRoutes from './chatRoutes';
import reportRoutes from './reportRoutes';

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
router.use('/chats', chatRoutes);
router.use('/reports', reportRoutes);

export default router;
