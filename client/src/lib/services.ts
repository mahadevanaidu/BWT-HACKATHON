import { api } from './api';
import type {
  Document,
  PaginatedResponse,
  DashboardStats,
  VerificationResult,
  DocumentFilters,
  CreateDocumentPayload,
  UpdateDocumentPayload,
  VerificationLog,
} from '@/types';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: { _id: string; email: string; name: string; role: string } }>('/auth/login', { email, password });
    return res.data;
  },
  me: async () => {
    const res = await api.get<{ user: { _id: string; email: string; name: string; role: string } }>('/auth/me');
    return res.data.user;
  },
  refresh: async () => {
    const res = await api.post<{ token: string }>('/auth/refresh');
    return res.data;
  },
};

// ─── Documents ────────────────────────────────────────────────────────────────

export const documentService = {
  list: async (filters: DocumentFilters = {}): Promise<PaginatedResponse<Document>> => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.status) params.set('status', filters.status);
    if (filters.documentType) params.set('documentType', filters.documentType);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

    const res = await api.get<PaginatedResponse<Document>>(`/documents?${params}`);
    return res.data;
  },

  get: async (id: string): Promise<Document> => {
    const res = await api.get<{ document: Document }>(`/documents/${id}`);
    return res.data.document;
  },

  create: async (payload: CreateDocumentPayload): Promise<Document> => {
    const res = await api.post<{ document: Document }>('/documents', payload);
    return res.data.document;
  },

  update: async (id: string, payload: UpdateDocumentPayload): Promise<Document> => {
    const res = await api.patch<{ document: Document }>(`/documents/${id}`, payload);
    return res.data.document;
  },

  revoke: async (id: string, reason?: string): Promise<Document> => {
    const res = await api.post<{ document: Document; message: string }>(`/documents/${id}/revoke`, { reason });
    return res.data.document;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  regenerateQR: async (id: string) => {
    const res = await api.post<{ qrCodeDataUrl: string; verificationUrl: string }>(`/documents/${id}/qrcode`);
    return res.data;
  },

  getHistory: async (id: string): Promise<VerificationLog[]> => {
    const res = await api.get<{ logs: VerificationLog[] }>(`/documents/${id}/history`);
    return res.data.logs;
  },
};

// ─── Verification (public, no auth) ──────────────────────────────────────────

export const verificationService = {
  verify: async (verificationId: string): Promise<VerificationResult> => {
    try {
      const res = await api.get<VerificationResult>(`/verify/${verificationId}`);
      return res.data;
    } catch (err: unknown) {
      // 404 is a valid "not found" result, not an exception
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status: number; data?: VerificationResult } };
        if (axiosErr.response?.status === 404) {
          return axiosErr.response.data || { status: 'not_found', verificationId, message: 'Document not found.' };
        }
      }
      throw err;
    }
  },
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const statsService = {
  dashboard: async (): Promise<DashboardStats> => {
    const res = await api.get<DashboardStats>('/stats/dashboard');
    return res.data;
  },
};
