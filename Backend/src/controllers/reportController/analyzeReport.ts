import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import config from '../../config/config';
import FormData from 'form-data';

// @desc    Analyze medical file and get summary (no session creation)
// @route   POST /api/reports/analyze
// @access  Private
export const analyzeReport = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!req.file) {
    res.status(400).json({
      status: 'error',
      message: 'File is required'
    });
    return;
  }

  // Validate file type (only JSON and PDF)
  const allowedTypes = ['.json', '.pdf', 'application/json', 'application/pdf'];
  const fileExt = req.file.originalname.toLowerCase().substring(req.file.originalname.lastIndexOf('.'));
  
  if (!allowedTypes.includes(fileExt) && !allowedTypes.includes(req.file.mimetype)) {
    res.status(400).json({
      status: 'error',
      message: `Invalid file type. Only JSON and PDF files are allowed. Got: ${fileExt}`
    });
    return;
  }

  // Call AI Model API to analyze file (POST /session/new/with-file)
  // We use the session endpoint but won't save the session in DB
  const formData = new FormData();
  formData.append('file', req.file.buffer, {
    filename: req.file.originalname,
    contentType: req.file.mimetype
  });

  const aiResponse = await fetch(`${config.aiModelBaseUrl}/session/new/with-file`, {
    method: 'POST',
    body: formData as any,
    headers: formData.getHeaders()
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('AI API Error:', errorText);
    throw new Error(`AI API returned status ${aiResponse.status}: ${errorText}`);
  }

  const aiData = await aiResponse.json() as {
    session_id?: string;
    welcome_message?: string;
    pre_filled_sections?: string[];
    extracted_data?: any;
    error?: string;
  };

  if (aiData.error) {
    res.status(400).json({
      status: 'error',
      message: aiData.error
    });
    return;
  }

  const aiSessionId = aiData.session_id || '';
  const preFilledSections = aiData.pre_filled_sections || [];
  const extractedData = aiData.extracted_data || {};

  // Now get the summary from AI using the temporary session
  let summary: string = '';

  try {
    const summaryResponse = await fetch(`${config.aiModelBaseUrl}/summary/${aiSessionId}`, {
      method: 'GET'
    });

    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json() as {
        summary?: string;
        error?: string;
      };

      if (!summaryData.error) {
        summary = summaryData.summary || '';
      }
    }
  } catch (summaryError) {
    console.warn('Failed to get summary, continuing without it:', summaryError);
    // Continue without summary - not critical
  }

  // Return analysis without creating conversation in DB
  res.status(200).json({
    status: 'success',
    message: 'File analyzed successfully',
    data: {
      filename: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      extractedData,
      preFilledSections,
      summary: summary || 'Summary not available - complete the clinical interview for a full summary',
      analyzedAt: new Date().toISOString(),
      ...(userId && { userId })
    }
  });
});
