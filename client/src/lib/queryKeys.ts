import type { DocumentFilters } from '@/types';

export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  documents: {
    all: () => ['documents'] as const,
    list: (filters: DocumentFilters) => ['documents', 'list', filters] as const,
    detail: (id: string) => ['documents', 'detail', id] as const,
    history: (id: string) => ['documents', 'history', id] as const,
  },
  stats: {
    dashboard: () => ['stats', 'dashboard'] as const,
  },
  verification: {
    result: (id: string) => ['verification', id] as const,
  },
};
