import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import Conversation from '../../models/Conversation';

// @desc    Delete conversation (keep related files)
// @route   DELETE /api/chats/:id
// @access  Private
export const deleteConversation = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        status: 'error',
        message: 'Conversation ID is required'
      });
      return;
    }

    // Find and delete the conversation
    const deletedConversation = await Conversation.findByIdAndDelete(id);

    if (!deletedConversation) {
      res.status(404).json({
        status: 'error',
        message: 'Conversation not found'
      });
      return;
    }

    // Note: We're not deleting related files (Reports) as per requirement
    res.status(200).json({
      status: 'success',
      message: 'Conversation deleted successfully',
      data: {
        deletedConversationId: id
      }
    });
  } catch (err) {
    console.error('Delete conversation error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete conversation'
    });
  }
});
