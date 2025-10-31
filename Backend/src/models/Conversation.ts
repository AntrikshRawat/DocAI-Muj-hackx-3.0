import mongoose, { Document, Schema } from 'mongoose';

// Message interface
export interface IMessage {
  sender: 'user' | 'llm';
  text?: string;
  fileId?: mongoose.Types.ObjectId;
  timestamp: Date;
}

// Conversation interface
export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Message schema
const messageSchema = new Schema<IMessage>({
  sender: {
    type: String,
    enum: ['user', 'llm'], // who sent it
    required: true,
  },
  text: {
    type: String, // chat text (optional if file only)
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report', // reference to your encrypted file model
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Conversation schema
const conversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
      sessionId: {
        type: String,
        required: true, // identifier for this chat session
        index: true,
      },
    messages: [messageSchema], // all messages in one chat session
  },
  { timestamps: true } // adds createdAt, updatedAt
);

// Indexes for faster queries
conversationSchema.index({ userId: 1 });
conversationSchema.index({ createdAt: -1 });

const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;
