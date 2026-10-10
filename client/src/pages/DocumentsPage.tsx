import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Plus, Filter, ChevronLeft, ChevronRight,
  Eye, ShieldX, Trash2, QrCode, ExternalLink,
} from 'lucide-react';
import { documentService } from '@/lib/services';
import { queryKeys } from '@/lib/queryKeys';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { formatDate, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPES, truncate } from '@/lib/utils';
import { getApiError } from '@/lib/api';
import type { Document, DocumentFilters, DocumentType, DocumentStatus } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'valid', label: 'Valid' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'expired', label: 'Expired' },
  { value: 'suspended', label: 'Suspended' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  ...DOCUMENT_TYPES.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABELS[t] })),
];

export default function DocumentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | ''>('');
  const [page, setPage] = useState(1);
  const [revokeTarget, setRevokeTarget] = useState<Document | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const filters: DocumentFilters = {
    q: debouncedSearch || undefined,
    status: statusFilter || undefined,
    documentType: typeFilter || undefined,
    page,
    limit: 15,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.documents.list(filters),
    queryFn: () => documentService.list(filters),
    placeholderData: (prev) => prev,
  });

  const revokeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      documentService.revoke(id, reason),
    onSuccess: () => {
      toast('success', 'Document revoked', 'The document has been permanently revoked.');
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.dashboard() });
      setRevokeTarget(null);
    },
    onError: (err) => toast('error', 'Revocation failed', getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentService.delete(id),
    onSuccess: () => {
      toast('success', 'Document deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.dashboard() });
      setDeleteTarget(null);
    },
    onError: (err) => toast('error', 'Deletion failed', getApiError(err)),
  });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const docs = data?.documents ?? [];
  const pagination = data?.pagination;

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <motion.h1
            className="text-2xl font-semibold text-warm-white tracking-tight"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Document Registry
          </motion.h1>
          <p className="text-sm text-warm-muted mt-0.5">
            {pagination ? `${pagination.total.toLocaleString()} documents` : 'Loading…'}
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/documents/new')}
        >
          Issue Document
        </Button>
      </div>

      {/* Filters */}
      <motion.div
        className="verity-card p-4 mb-5 flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex-1">
          <Input
            placeholder="Search by title, holder, institution, or ID…"
            value={search}
            onChange={handleSearchChange}
            leftElement={<Search className="w-4 h-4" />}
            rightElement={isFetching ? <Spinner size="sm" /> : undefined}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 text-warm-muted">
            <Filter className="w-3.5 h-3.5 shrink-0" />
          </div>
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as DocumentStatus | ''); setPage(1); }}
            className="w-40"
          />
          <Select
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as DocumentType | ''); setPage(1); }}
            className="w-40"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        className="verity-card overflow-hidden"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : docs.length === 0 ? (
          <EmptyState
            icon={Search}
            title={search || statusFilter || typeFilter ? 'No matching documents' : 'No documents yet'}
            description={
              search || statusFilter || typeFilter
                ? 'Try adjusting your search or filters.'
                : 'Issue your first document to get started.'
            }
            action={
              !search && !statusFilter && !typeFilter ? (
                <Button
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => navigate('/documents/new')}
                >
                  Issue Document
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th className="hidden md:table-cell">Type</th>
                  <th>Holder</th>
                  <th className="hidden lg:table-cell">Institution</th>
                  <th className="hidden sm:table-cell">Issued</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc, i) => (
                  <motion.tr
                    key={doc._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/documents/${doc._id}`)}
                  >
                    <td>
                      <div>
                        <p className="font-medium text-warm-white group-hover:text-emerald transition-colors">
                          {truncate(doc.title, 36)}
                        </p>
                        <p className="text-2xs font-mono text-warm-muted mt-0.5">{doc.verificationId}</p>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="text-xs text-warm-muted capitalize">
                        {DOCUMENT_TYPE_LABELS[doc.documentType]}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm text-warm-white">{doc.holderName}</p>
                      {doc.holderEmail && (
                        <p className="text-2xs text-warm-muted">{doc.holderEmail}</p>
                      )}
                    </td>
                    <td className="hidden lg:table-cell">
                      <p className="text-sm text-warm-muted">{truncate(doc.issuingInstitution, 30)}</p>
                    </td>
                    <td className="hidden sm:table-cell">
                      <p className="text-xs text-warm-muted">{formatDate(doc.issueDate)}</p>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={doc.effectiveStatus || doc.status} size="sm" />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/documents/${doc._id}`)}
                          className="p-1.5 rounded-md text-warm-muted hover:text-warm-white hover:bg-bg-elevated transition-colors"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => window.open(`/verify/${doc.verificationId}`, '_blank')}
                          className="p-1.5 rounded-md text-warm-muted hover:text-warm-white hover:bg-bg-elevated transition-colors"
                          title="Open verification link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/documents/${doc._id}#qr`)}
                          className="p-1.5 rounded-md text-warm-muted hover:text-warm-white hover:bg-bg-elevated transition-colors"
                          title="View QR code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        {doc.status !== 'revoked' && (
                          <button
                            onClick={() => setRevokeTarget(doc)}
                            className="p-1.5 rounded-md text-warm-muted hover:text-status-revoked hover:bg-status-revoked/5 transition-colors"
                            title="Revoke document"
                          >
                            <ShieldX className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="p-1.5 rounded-md text-warm-muted hover:text-status-revoked hover:bg-status-revoked/5 transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-warm-muted">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Revoke Confirm */}
      <ConfirmDialog
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => revokeTarget && revokeMutation.mutate({ id: revokeTarget._id, reason: 'Revoked by administrator.' })}
        title="Revoke Document"
        description={`Are you sure you want to revoke "${revokeTarget?.title}"? This action cannot be undone through normal operations.`}
        confirmLabel="Revoke"
        loading={revokeMutation.isPending}
        variant="danger"
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        title="Delete Document"
        description={`Permanently delete "${deleteTarget?.title}"? All verification history will be lost.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
