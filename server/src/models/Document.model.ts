import mongoose, { Document, Schema } from 'mongoose';

export type DocumentStatus = 'valid' | 'revoked' | 'expired' | 'suspended';
export type DocumentType =
  | 'certificate'
  | 'diploma'
  | 'license'
  | 'permit'
  | 'id_card'
  | 'transcript'
  | 'contract'
  | 'other';

export interface IDocument extends Document {
  // Public verification ID
  verificationId: string;

  // Document information
  title: string;
  documentType: DocumentType;
  holderName: string;
  holderEmail?: string;
  issuingInstitution: string;
  issuerDepartment?: string;

  // Dates
  issueDate: Date;
  expirationDate?: Date | null;

  // Status
  status: DocumentStatus;

  // Metadata
  description?: string;
  metadata?: Record<string, string>;
  tags?: string[];

  // Integrity
  integrityHash: string;

  // QR Code
  qrCodeDataUrl: string;
  verificationUrl: string;

  // Audit
  issuedBy: mongoose.Types.ObjectId;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  revocationReason?: string;
  lastIntegrityCheck?: Date;

  // Timestamps (added by timestamps option)
  createdAt: Date;
  updatedAt: Date;

  // Computed
  effectiveStatus: DocumentStatus;
}

const DocumentSchema = new Schema<IDocument>(
  {
    verificationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    documentType: {
      type: String,
      required: [true, 'Document type is required'],
      enum: ['certificate', 'diploma', 'license', 'permit', 'id_card', 'transcript', 'contract', 'other'],
    },
    holderName: {
      type: String,
      required: [true, 'Holder name is required'],
      trim: true,
      maxlength: [200, 'Holder name must not exceed 200 characters'],
    },
    holderEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    issuingInstitution: {
      type: String,
      required: [true, 'Issuing institution is required'],
      trim: true,
      maxlength: [200, 'Institution name must not exceed 200 characters'],
    },
    issuerDepartment: {
      type: String,
      trim: true,
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
    },
    expirationDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['valid', 'revoked', 'expired', 'suspended'],
      default: 'valid',
    },
    description: {
      type: String,
      maxlength: [1000, 'Description must not exceed 1000 characters'],
    },
    metadata: {
      type: Map,
      of: String,
    },
    tags: [{ type: String, trim: true }],
    integrityHash: {
      type: String,
      required: true,
    },
    qrCodeDataUrl: {
      type: String,
      required: true,
    },
    verificationUrl: {
      type: String,
      required: true,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    revokedAt: Date,
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    revocationReason: String,
    lastIntegrityCheck: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Virtual: compute effective status at read time (accounts for expiration)
DocumentSchema.virtual('effectiveStatus').get(function () {
  if (this.status === 'revoked' || this.status === 'suspended') {
    return this.status;
  }
  if (this.expirationDate && new Date() > this.expirationDate) {
    return 'expired' as DocumentStatus;
  }
  return this.status;
});

// Include virtuals in JSON/Object conversion
DocumentSchema.set('toJSON', { virtuals: true });
DocumentSchema.set('toObject', { virtuals: true });

// Text index for search
DocumentSchema.index({
  title: 'text',
  holderName: 'text',
  issuingInstitution: 'text',
  verificationId: 'text',
});

// Compound index for common queries
DocumentSchema.index({ status: 1, createdAt: -1 });
DocumentSchema.index({ documentType: 1, status: 1 });
DocumentSchema.index({ issuedBy: 1, createdAt: -1 });

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
