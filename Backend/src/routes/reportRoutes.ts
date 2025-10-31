import { Router } from 'express';
import multer from 'multer';
import { uploadReport } from '../controllers/reportController/uploadReport';
import { downloadReport } from '../controllers/reportController/downloadReport';
import { analyzeReport } from '../controllers/reportController/analyzeReport';

const router = Router();

// Configure multer for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

// @route   POST /api/reports/analyze
// @desc    Analyze medical file and get summary (no session creation)
// @access  Private
router.post('/analyze', upload.single('file'), analyzeReport);

// @route   POST /api/reports/upload
// @desc    Upload encrypted report
// @access  Private
router.post('/upload', upload.single('file'), uploadReport);

// @route   GET /api/reports/:id
// @desc    Download encrypted report
// @access  Private
router.get('/:id', downloadReport);

export default router;
