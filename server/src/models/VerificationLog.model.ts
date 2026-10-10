import mongoose, { Document, Schema } from 'mongoose';

export interface IVerificationLog extends Document {
  verificationId: string;
  documentId: mongoose.Types.ObjectId;
  requestedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  resultStatus: 'valid' | 'revoked' | 'expired' | 'not_found' | 'integrity_failed' | 'suspended';
  integrityPassed: boolean;
  createdAt: Date;
}

const VerificationLogSchema = new Schema<IVerificationLog>(
  {
    verificationId: {
      type: String,
      required: true,
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: false,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: String,
    userAgent: String,
    resultStatus: {
      type: String,
      enum: ['valid', 'revoked', 'expired', 'not_found', 'integrity_failed', 'suspended'],
      required: true,
    },
    integrityPassed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// TTL: Keep logs for 2 years
VerificationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });
VerificationLogSchema.index({ documentId: 1, createdAt: -1 });

export const VerificationLog = mongoose.model<IVerificationLog>(
  'VerificationLog',
  VerificationLogSchema
);
