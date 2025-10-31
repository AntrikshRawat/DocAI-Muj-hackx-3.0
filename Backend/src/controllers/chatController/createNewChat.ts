import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import Conversation from '../../models/Conversation';
import config from '../../config/config';

// @desc    Create new chat window/conversation
// @route   POST /api/chats/new
// @access  Private
export const createNewChat = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
      return;
    }

    // Call AI Model API to create new session (GET /session/new)
    let aiSessionId: string;
    let welcomeMessage: string;

    try {
      const aiResponse = await fetch(`${config.aiModelBaseUrl}/session/new`, {
        method: 'GET'
      });

      if (!aiResponse.ok) {
        throw new Error(`AI API returned status ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json() as {
        session_id: string;
        welcome_message: string;
      };

      aiSessionId = aiData.session_id;
      welcomeMessage = aiData.welcome_message;

    } catch (aiError) {
      console.error('Failed to create AI session:', aiError);
      res.status(500).json({
        status: 'error',
        message: 'Failed to initialize AI session. Please try again.'
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
      message: 'New chat window created successfully',
      data: {
        sessionId: aiSessionId,
        welcomeMessage
      }
    });
  } catch (err) {
    console.error('Create chat error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create new chat window'
    });
  }
});
