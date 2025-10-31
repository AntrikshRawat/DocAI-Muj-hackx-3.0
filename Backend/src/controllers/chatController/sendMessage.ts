import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import Conversation from '../../models/Conversation';
import mongoose from 'mongoose';
import config from '../../config/config';

// @desc    Send message to AI model and save conversation
// @route   POST /api/chats/message
// @access  Private
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { message, sessionId, userId, fileId } = req.body;

    // Validate required fields
    if (!message || !sessionId || !userId) {
      res.status(400).json({
        status: 'error',
        message: 'Message, sessionId, and userId are required'
      });
      return;
    }

    // Validate message is not empty or whitespace only
    if (!message.trim()) {
      res.status(400).json({
        status: 'error',
        message: 'Please provide an answer to the question. Your response cannot be empty.'
      });
      return;
    }

    // Validate message length (max 5000 characters as per AI API)
    if (message.length > 5000) {
      res.status(400).json({
        status: 'error',
        message: 'Your message is too long. Please keep your response under 5000 characters.'
      });
      return;
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid userId format'
      });
      return;
    }

    // Find or create conversation for this session
    let conversation = await Conversation.findOne({ 
      sessionId, 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    if (!conversation) {
      // Create new conversation if it doesn't exist
      conversation = await Conversation.create({
        userId: new mongoose.Types.ObjectId(userId),
        sessionId,
        messages: []
      });
    }

    // Save user message to database
    const userMessage = {
      sender: 'user' as const,
      text: message,
      fileId: fileId ? new mongoose.Types.ObjectId(fileId) : undefined,
      timestamp: new Date()
    };

    conversation.messages.push(userMessage);
    await conversation.save();

    // Call AI Model API (POST /chat/{session_id})
    let aiResponseText: string;
    let progress = 0;
    let completed = false;
    
    try {
      const aiResponse = await fetch(`${config.aiModelBaseUrl}/chat/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_message: message
        })
      });

      if (!aiResponse.ok) {
        throw new Error(`AI API returned status ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json() as {
        message?: string;
        progress?: number;
        completed?: boolean;
        error?: string;
      };

      // Check for AI API errors
      if (aiData.error) {
        console.error('AI Model API Error:', aiData.error);
        aiResponseText = 'Sorry, I encountered an error processing your request. Please try again.';
      } else {
        aiResponseText = aiData.message || 'No response from AI model';
        progress = aiData.progress || 0;
        completed = aiData.completed || false;
      }
      
    } catch (aiError) {
      console.error('AI Model API Error:', aiError);
      // Save error message as LLM response
      aiResponseText = 'Sorry, I encountered an error connecting to the AI service. Please try again.';
    }

    // Save LLM response to database
    const llmMessage = {
      sender: 'llm' as const,
      text: aiResponseText,
      timestamp: new Date()
    };

    conversation.messages.push(llmMessage);
    await conversation.save();

    // Send response to frontend
    res.status(200).json({
      status: 'success',
      message: 'Message sent and response received',
      data: {
        sessionId: conversation.sessionId,
        userMessage: {
          text: message,
          timestamp: userMessage.timestamp
        },
        aiResponse: {
          text: aiResponseText,
          timestamp: llmMessage.timestamp
        },
        progress,
        completed,
        messageCount: conversation.messages.length
      }
    });

  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message'
    });
  }
});
