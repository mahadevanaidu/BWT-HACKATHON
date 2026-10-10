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

export type VerificationResultStatus =
  | 'valid'
  | 'revoked'
  | 'expired'
  | 'suspended'
  | 'not_found'
  | 'integrity_failed';

export interface Document {
  _id: string;
  verificationId: string;
  title: string;
  documentType: DocumentType;
  holderName: string;
  holderEmail?: string;
  issuingInstitution: string;
  issuerDepartment?: string;
  issueDate: string;
  expirationDate?: string | null;
  status: DocumentStatus;
  effectiveStatus: DocumentStatus;
  description?: string;
  metadata?: Record<string, string>;
  tags?: string[];
  integrityHash: string;
  qrCodeDataUrl: string;
  verificationUrl: string;
  issuedBy: { _id: string; name: string; email: string } | string;
  revokedAt?: string;
  revokedBy?: { _id: string; name: string; email: string } | string;
  revocationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationResult {
  status: VerificationResultStatus;
  verificationId: string;
  title?: string;
  documentType?: DocumentType;
  holderName?: string;
  issuingInstitution?: string;
  issueDate?: string;
  expirationDate?: string | null;
  integrityVerified?: boolean;
  verifiedAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  message?: string;
  error?: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'viewer';
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface PaginatedResponse<T> {
  documents: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DashboardStats {
  documents: {
    total: number;
    valid: number;
    revoked: number;
    expired: number;
    suspended: number;
    expiringSoon: number;
    recentlyIssued: number;
  };
  verifications: {
    total: number;
    lastSevenDays: number;
  };
  verificationTrend: Array<{
    _id: string;
    count: number;
    valid: number;
    failed: number;
  }>;
  recentActivity: Array<{
    _id: string;
    verificationId: string;
    resultStatus: VerificationResultStatus;
    requestedAt: string;
    integrityPassed: boolean;
    documentId?: {
      title: string;
      holderName: string;
      verificationId: string;
    };
  }>;
  typeDistribution: Array<{ _id: DocumentType; count: number }>;
}

export interface DocumentFilters {
  q?: string;
  status?: DocumentStatus | '';
  documentType?: DocumentType | '';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateDocumentPayload {
  title: string;
  documentType: DocumentType;
  holderName: string;
  holderEmail?: string;
  issuingInstitution: string;
  issuerDepartment?: string;
  issueDate: string;
  expirationDate?: string;
  description?: string;
  tags?: string[];
}

export type UpdateDocumentPayload = Partial<CreateDocumentPayload>;

export interface VerificationLog {
  _id: string;
  verificationId: string;
  documentId?: string;
  requestedAt: string;
  ipAddress?: string;
  userAgent?: string;
  resultStatus: VerificationResultStatus;
  integrityPassed: boolean;
  createdAt: string;
}
