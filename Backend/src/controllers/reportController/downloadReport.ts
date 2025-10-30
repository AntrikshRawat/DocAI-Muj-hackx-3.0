import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import crypto from 'crypto';
import Report from '../../models/Report';

// --- AES encryption setup ---
const AES_KEY = crypto.randomBytes(32); // 256-bit key (hackathon only — replace with env key)
console.log('AES Key (keep this safe!):', AES_KEY.toString('base64'));

// --- Helper function ---
function decryptBuffer(encrypted: Buffer, iv: Buffer, authTag: Buffer) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// @desc    Download encrypted report
// @route   GET /api/reports/:id
// @access  Private
export const downloadReport = asyncHandler(async (req: Request, res: Response) => {
  try {
    const file = await Report.findById(req.params.id);
    if (!file) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    const decrypted = decryptBuffer(
      file.encryptedData,
      Buffer.from(file.iv, 'base64'),
      Buffer.from(file.authTag, 'base64')
    );

    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', file.mimetype);
    res.send(decrypted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Download failed' });
  }
});

