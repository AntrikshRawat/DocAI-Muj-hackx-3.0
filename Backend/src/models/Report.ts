import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  filename: string;
  mimetype: string;
  encryptedData: Buffer;
  iv: string;
  authTag: string;
  uploadedBy: mongoose.Types.ObjectId;
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    filename: {
      type: String,
      required: true, // original file name, e.g. "report.pdf"
    },
    mimetype: {
      type: String,
      required: true, // e.g. "application/pdf"
    },
    encryptedData: {
      type: Buffer,
      required: true, // AES-encrypted file content
    },
    iv: {
      type: String,
      required: true, // base64 IV used for AES encryption
    },
    authTag: {
      type: String,
      required: true, // base64 authentication tag (for AES-GCM)
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionId: {
      type: String,
      required: true, // identifier for the chat/session this report belongs to
      index: true,
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Indexes for faster queries
reportSchema.index({ uploadedBy: 1 });
reportSchema.index({ createdAt: -1 });

const Report = mongoose.model<IReport>('Report', reportSchema);

export default Report;
