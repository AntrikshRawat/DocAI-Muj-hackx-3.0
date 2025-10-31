import { Router } from 'express';
import multer from 'multer';
import { createNewChat } from '../controllers/chatController/createNewChat';
import { createChatWithFile } from '../controllers/chatController/createChatWithFile';
import { deleteConversation } from '../controllers/chatController/deleteConversation';
import { getChatSummary } from '../controllers/chatController/getChatSummary';
import { sendMessage } from '../controllers/chatController/sendMessage';

const router = Router();

// Configure multer for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

// @route   POST /api/chats/new
// @desc    Create new chat window/conversation
// @access  Private
router.post('/new', createNewChat);

// @route   POST /api/chats/new/with-file
// @desc    Create new chat with file upload (for pre-filling medical data)
// @access  Private
router.post('/new/with-file', upload.single('file'), createChatWithFile);

// @route   POST /api/chats/message
// @desc    Send message to AI model and save conversation
// @access  Private
router.post('/message', sendMessage);

// @route   DELETE /api/chats/:sessionId
// @desc    Delete conversation (keep related files)
// @access  Private
router.delete('/:sessionId', deleteConversation);

// @route   POST /api/chats/summary
// @desc    Get chat summary from AI model
// @access  Private
router.post('/summary', getChatSummary);

export default router;
