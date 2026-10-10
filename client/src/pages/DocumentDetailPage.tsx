import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Copy, Download, ExternalLink, ShieldX,
  Clock, Shield, Check, QrCode, History, Edit, ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { documentService } from '@/lib/services';
import { queryKeys } from '@/lib/queryKeys';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageLoader } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { formatDate, formatRelative, DOCUMENT_TYPE_LABELS, copyToClipboard, downloadDataUrl } from '@/lib/utils';
import { getApiError } from '@/lib/api';

function DetailRow({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="py-3 grid grid-cols-5 gap-4 border-b border-border/50 last:border-0">
      <dt className="col-span-2 text-xs text-warm-muted font-medium">{label}</dt>
      <dd className={`col-span-3 text-sm ${mono ? 'font-mono text-emerald text-xs break-all' : 'text-warm-white'}`}>
        {value}
      </dd>
    </div>
  );
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showRevoke, setShowRevoke] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: doc, isLoading, isError } = useQuery({
    queryKey: queryKeys.documents.detail(id!),
    queryFn: () => documentService.get(id!),
    enabled: !!id,
  });

  const { data: history } = useQuery({
    queryKey: queryKeys.documents.history(id!),
    queryFn: () => documentService.getHistory(id!),
    enabled: !!id && showHistory,
  });

  const revokeMutation = useMutation({
    mutationFn: ({ reason }: { reason?: string }) => documentService.revoke(id!, reason),
    onSuccess: () => {
      toast('success', 'Document revoked');
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.detail(id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.dashboard() });
      setShowRevoke(false);
    },
    onError: (err) => toast('error', 'Revocation failed', getApiError(err)),
  });

  // Scroll to QR code if #qr hash present
  useEffect(() => {
    if (window.location.hash === '#qr') {
      setTimeout(() => {
        document.getElementById('qr-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [doc]);

  async function handleCopyLink() {
    if (!doc) return;
    await copyToClipboard(doc.verificationUrl);
    setCopied(true);
    toast('success', 'Verification link copied');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadQR() {
    if (!doc) return;
    downloadDataUrl(doc.qrCodeDataUrl, `verity-qr-${doc.verificationId}.png`);
  }

  if (isLoading) return <PageLoader />;

  if (isError || !doc) {
    return (
      <div className="page-container py-16 text-center">
        <Shield className="w-10 h-10 text-warm-muted mx-auto mb-3" />
        <p className="text-warm-white font-medium">Document not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/documents')}>
          Back to Registry
        </Button>
      </div>
    );
  }

  const effectiveStatus = doc.effectiveStatus || doc.status;
  const issuer = typeof doc.issuedBy === 'object' ? doc.issuedBy : null;

  return (
    <div className="page-container py-8 max-w-4xl">
      {/* Back + breadcrumb */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/documents')}
          className="flex items-center gap-1.5 text-sm text-warm-muted hover:text-warm-white transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Registry
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <motion.h1
              className="text-2xl font-semibold text-warm-white tracking-tight"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {doc.title}
            </motion.h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={effectiveStatus} />
              <span className="font-mono text-xs text-warm-muted">{doc.verificationId}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyLink}
            >
              {copied ? 'Copied' : 'Copy Link'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => window.open(`/verify/${doc.verificationId}`, '_blank')}
            >
              Verify
            </Button>
            {effectiveStatus !== 'revoked' && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<ShieldX className="w-3.5 h-3.5" />}
                onClick={() => setShowRevoke(true)}
              >
                Revoke
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Document details */}
        <motion.div
          className="lg:col-span-2 space-y-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="verity-card p-5">
            <h2 className="text-sm font-semibold text-warm-white mb-4 flex items-center gap-2">
              <Edit className="w-4 h-4 text-warm-muted" />
              Document Details
            </h2>
            <dl>
              <DetailRow label="Document Type" value={DOCUMENT_TYPE_LABELS[doc.documentType]} />
              <DetailRow label="Holder Name" value={doc.holderName} />
              <DetailRow label="Holder Email" value={doc.holderEmail} />
              <DetailRow label="Issuing Institution" value={doc.issuingInstitution} />
              <DetailRow label="Department" value={doc.issuerDepartment} />
              <DetailRow label="Issue Date" value={formatDate(doc.issueDate)} />
              <DetailRow
                label="Expiration Date"
                value={doc.expirationDate ? formatDate(doc.expirationDate) : 'No expiration'}
              />
              {doc.description && <DetailRow label="Description" value={doc.description} />}
              {doc.tags?.length ? <DetailRow label="Tags" value={doc.tags.join(', ')} /> : null}
            </dl>
          </div>

          {/* Integrity & Audit */}
          <div className="verity-card p-5">
            <h2 className="text-sm font-semibold text-warm-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-warm-muted" />
              Integrity & Audit
            </h2>
            <dl>
              <DetailRow label="Integrity Hash (SHA-256)" value={doc.integrityHash} mono />
              <DetailRow label="Issued By" value={issuer?.name} />
              <DetailRow label="Issuer Email" value={issuer?.email} />
              <DetailRow label="Created" value={`${formatDate(doc.createdAt)} (${formatRelative(doc.createdAt)})`} />
              <DetailRow label="Last Updated" value={`${formatDate(doc.updatedAt)} (${formatRelative(doc.updatedAt)})`} />
              {doc.revokedAt && (
                <>
                  <DetailRow label="Revoked At" value={`${formatDate(doc.revokedAt)} (${formatRelative(doc.revokedAt)})`} />
                  <DetailRow label="Revocation Reason" value={doc.revocationReason} />
                </>
              )}
            </dl>
          </div>

          {/* Verification History */}
          <div className="verity-card p-5">
            <button
              className="w-full flex items-center justify-between text-sm font-semibold text-warm-white"
              onClick={() => setShowHistory((v) => !v)}
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-warm-muted" />
                Verification History
              </span>
              {showHistory ? <ChevronUp className="w-4 h-4 text-warm-muted" /> : <ChevronDown className="w-4 h-4 text-warm-muted" />}
            </button>

            {showHistory && (
              <motion.div
                className="mt-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                {!history || history.length === 0 ? (
                  <p className="text-sm text-warm-muted py-3">No verifications recorded yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {history.slice(0, 20).map((log) => (
                      <div key={log._id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                        <div className="flex items-center gap-2.5">
                          <StatusBadge status={log.resultStatus} size="sm" showDot={false} />
                          <span className="text-xs text-warm-muted">{formatRelative(log.requestedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-2xs text-warm-muted">
                          {log.integrityPassed ? (
                            <span className="text-status-valid">✓ Integrity OK</span>
                          ) : (
                            <span className="text-status-revoked">✗ Integrity failed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* QR Code panel */}
        <motion.div
          id="qr-section"
          className="space-y-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="verity-card p-5">
            <h2 className="text-sm font-semibold text-warm-white mb-4 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-warm-muted" />
              Verification QR Code
            </h2>

            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className={`p-3 rounded-xl bg-white ${effectiveStatus === 'revoked' ? 'opacity-50 grayscale' : ''}`}>
                  <img
                    src={doc.qrCodeDataUrl}
                    alt={`QR code for ${doc.verificationId}`}
                    className="w-44 h-44 block"
                  />
                </div>
                {effectiveStatus === 'revoked' && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-status-revoked/10 border-2 border-status-revoked/40">
                    <span className="text-xs font-bold text-status-revoked rotate-[-20deg] tracking-wider">REVOKED</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-warm-muted text-center mb-4 font-mono break-all px-1">
              {doc.verificationUrl}
            </p>

            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleDownloadQR}
              >
                Download QR Code
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                leftIcon={<Copy className="w-4 h-4" />}
                onClick={handleCopyLink}
              >
                Copy Verification Link
              </Button>
            </div>
          </div>

          {/* Status card */}
          <div className="verity-card p-5">
            <h2 className="text-sm font-semibold text-warm-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-warm-muted" />
              Current Status
            </h2>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated">
              <StatusBadge status={effectiveStatus} />
            </div>
            {doc.expirationDate && (
              <p className="text-xs text-warm-muted mt-2.5">
                {new Date() > new Date(doc.expirationDate)
                  ? `Expired ${formatRelative(doc.expirationDate)}`
                  : `Expires ${formatRelative(doc.expirationDate)}`}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Revoke confirm */}
      <ConfirmDialog
        isOpen={showRevoke}
        onClose={() => setShowRevoke(false)}
        onConfirm={() => revokeMutation.mutate({ reason: 'Revoked by administrator.' })}
        title="Revoke Document"
        description={`Revoke "${doc.title}"? This cannot be undone through normal operations. The QR code will immediately reflect the revoked status.`}
        confirmLabel="Revoke Document"
        loading={revokeMutation.isPending}
      />
    </div>
  );
}
