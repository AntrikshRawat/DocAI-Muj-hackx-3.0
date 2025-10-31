import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import Conversation from '../../models/Conversation';
import config from '../../config/config';
import FormData from 'form-data';

// @desc    Create new chat with file upload (for pre-filling medical data)
// @route   POST /api/chats/new/with-file
// @access  Private
export const createChatWithFile = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
      return;
    }

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

    // Call AI Model API to create session with file (POST /session/new/with-file)
    let aiSessionId: string;
    let welcomeMessage: string;
    let preFilledSections: string[] = [];
    let extractedData: any = {};

    try {
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
        throw new Error(`AI API returned status ${aiResponse.status}`);
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

      aiSessionId = aiData.session_id || '';
      welcomeMessage = aiData.welcome_message || '';
      preFilledSections = aiData.pre_filled_sections || [];
      extractedData = aiData.extracted_data || {};

    } catch (aiError) {
      console.error('Failed to create AI session with file:', aiError);
      res.status(500).json({
        status: 'error',
        message: 'Failed to initialize AI session with file. Please try again.'
      });
      return;
    }

    // Create new conversation with AI session ID
    await Conversation.create({
      userId,
      sessionId: aiSessionId,
      messages: []
    });

    res.status(201).json({
      status: 'success',
      message: 'New chat window created successfully with file data',
      data: {
        sessionId: aiSessionId,
        welcomeMessage,
        preFilledSections,
        extractedData
      }
    });
  } catch (err) {
    console.error('Create chat with file error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create new chat window with file'
    });
  }
});
