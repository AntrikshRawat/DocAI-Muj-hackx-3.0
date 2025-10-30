import { Router } from 'express';
import { googleSignIn } from '../controllers/authController';

const router = Router();

router.post('/google', googleSignIn);

export default router;
