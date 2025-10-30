import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import Conversation from '../../models/Conversation';

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

    // Create new conversation with empty messages array
    const newConversation = await Conversation.create({
      userId,
      messages: []
    });

    res.status(201).json({
      status: 'success',
      message: 'New chat window created successfully',
      data: {
        conversationId: newConversation._id,
        conversation: newConversation
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
