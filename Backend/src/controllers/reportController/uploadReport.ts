import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import crypto from 'crypto';
import Report from '../../models/Report';

// --- AES encryption setup ---
const AES_KEY = crypto.randomBytes(32); // 256-bit key (hackathon only — replace with env key)
console.log('AES Key (keep this safe!):', AES_KEY.toString('base64'));

// --- Helper function ---
function encryptBuffer(buffer: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encrypted, iv, authTag };
}

// @desc    Upload encrypted report
// @route   POST /api/reports/upload
// @access  Private
export const uploadReport = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const { uploadedBy, sessionId } = req.body;

    if (!uploadedBy) {
      res.status(400).json({ message: 'uploadedBy is required' });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ message: 'sessionId is required' });
      return;
    }

    const { encrypted, iv, authTag } = encryptBuffer(req.file.buffer);

    const doc = await Report.create({
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      encryptedData: encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      uploadedBy,
      sessionId
    });

    res.json({ 
      status: 'success',
      message: 'File stored securely',
      data: {
        id: doc._id,
        filename: doc.filename,
        sessionId: doc.sessionId
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

