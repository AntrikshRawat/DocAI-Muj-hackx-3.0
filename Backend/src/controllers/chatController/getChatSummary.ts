import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import Conversation from '../../models/Conversation';
import config from '../../config/config';

// @desc    Get chat summary from AI model
// @route   POST /api/chats/summary
// @access  Private
export const getChatSummary = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({
        status: 'error',
        message: 'Session ID is required'
      });
      return;
    }

    // Find conversation by sessionId to get message count
    const conversation = await Conversation.findOne({ sessionId });

    // Call AI Model API to get summary (GET /summary/{session_id})
    let summaryText: string;

    try {
      const aiResponse = await fetch(`${config.aiModelBaseUrl}/summary/${sessionId}`, {
        method: 'GET'
      });

      if (!aiResponse.ok) {
        throw new Error(`AI API returned status ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json() as {
        summary?: string;
        error?: string;
      };

      if (aiData.error) {
        console.error('AI Model Summary Error:', aiData.error);
        res.status(400).json({
          status: 'error',
          message: aiData.error
        });
        return;
      }

      summaryText = aiData.summary || 'No summary available';

    } catch (aiError) {
      console.error('Chat summary error:', aiError);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate chat summary from AI service'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Chat summary generated successfully',
      data: {
        sessionId,
        summary: summaryText,
        messageCount: conversation?.messages.length || 0
      }
    });
  } catch (err) {
    console.error('Chat summary error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate chat summary'
    });
  }
});
