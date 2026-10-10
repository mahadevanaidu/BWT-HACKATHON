import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ShieldX, Clock, AlertTriangle,
  Search, ExternalLink, Calendar,
} from 'lucide-react';
import { verificationService } from '@/lib/services';
import { queryKeys } from '@/lib/queryKeys';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate, DOCUMENT_TYPE_LABELS } from '@/lib/utils';
import type { VerificationResultStatus } from '@/types';

// ─── Status display config ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  VerificationResultStatus,
  {
    icon: React.ElementType;
    title: string;
    message: string;
    bg: string;
    border: string;
    text: string;
    iconColor: string;
  }
> = {
  valid: {
    icon: ShieldCheck,
    title: 'Document Verified',
    message: 'This document is authentic and currently valid.',
    bg: 'bg-status-valid/5',
    border: 'border-status-valid/30',
    text: 'text-status-valid',
    iconColor: 'text-status-valid',
  },
  revoked: {
    icon: ShieldX,
    title: 'Document Revoked',
    message: 'This document has been revoked and is no longer valid.',
    bg: 'bg-status-revoked/5',
    border: 'border-status-revoked/30',
    text: 'text-status-revoked',
    iconColor: 'text-status-revoked',
  },
  expired: {
    icon: Clock,
    title: 'Document Expired',
    message: 'This document has passed its expiration date.',
    bg: 'bg-status-expired/5',
    border: 'border-status-expired/30',
    text: 'text-status-expired',
    iconColor: 'text-status-expired',
  },
  suspended: {
    icon: AlertTriangle,
    title: 'Document Suspended',
    message: 'This document has been temporarily suspended.',
    bg: 'bg-status-suspended/5',
    border: 'border-status-suspended/30',
    text: 'text-status-suspended',
    iconColor: 'text-status-suspended',
  },
  not_found: {
    icon: Search,
    title: 'Document Not Found',
    message: 'No document exists with this verification ID.',
    bg: 'bg-bg-surface',
    border: 'border-border',
    text: 'text-warm-muted',
    iconColor: 'text-warm-muted',
  },
  integrity_failed: {
    icon: AlertTriangle,
    title: 'Integrity Check Failed',
    message: 'The document data does not match its original record. This document may have been tampered with.',
    bg: 'bg-status-revoked/5',
    border: 'border-status-revoked/40',
    text: 'text-status-revoked',
    iconColor: 'text-status-revoked',
  },
};

function VerifyField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="py-3 grid grid-cols-5 gap-3 border-b border-border/40 last:border-0">
      <dt className="col-span-2 text-xs text-warm-muted font-medium">{label}</dt>
      <dd className="col-span-3 text-sm text-warm-white">{value}</dd>
    </div>
  );
}

export default function VerifyPage() {
  const { verificationId } = useParams<{ verificationId: string }>();

  const { data: result, isLoading, isError } = useQuery({
    queryKey: queryKeys.verification.result(verificationId!),
    queryFn: () => verificationService.verify(verificationId!),
    enabled: !!verificationId,
    retry: false,
    staleTime: 0, // Always fresh — status must reflect current state
  });

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald/10 border border-emerald/20 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald" />
            </div>
            <span className="text-sm font-bold text-warm-white tracking-wider">VERITY</span>
          </Link>
          <span className="text-xs text-warm-muted">Document Verification</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          {isLoading && (
            <div className="flex flex-col items-center gap-4 py-20">
              <Spinner size="lg" />
              <p className="text-sm text-warm-muted">Verifying document…</p>
            </div>
          )}

          {isError && (
            <motion.div
              className="verity-card p-6 text-center"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AlertTriangle className="w-10 h-10 text-status-revoked mx-auto mb-3" />
              <h1 className="text-lg font-semibold text-warm-white">Verification Error</h1>
              <p className="text-sm text-warm-muted mt-1.5">
                Unable to reach the verification service. Please try again.
              </p>
            </motion.div>
          )}

          {result && (() => {
            const config = STATUS_CONFIG[result.status] || STATUS_CONFIG.not_found;
            const Icon = config.icon;
            const isValid = result.status === 'valid';

            return (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Status banner */}
                <div className={`rounded-2xl border ${config.bg} ${config.border} p-6 mb-5`}>
                  <div className="flex flex-col items-center text-center">
                    <motion.div
                      className={`w-16 h-16 rounded-full border-2 ${config.border} flex items-center justify-center mb-4 ${config.bg}`}
                      initial={{ scale: 0.7 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
                    >
                      <Icon className={`w-8 h-8 ${config.iconColor}`} />
                    </motion.div>

                    <motion.h1
                      className={`text-xl font-bold ${config.text} mb-1`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                    >
                      {config.title}
                    </motion.h1>
                    <motion.p
                      className="text-sm text-warm-muted max-w-xs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 }}
                    >
                      {config.message}
                    </motion.p>

                    {isValid && result.integrityVerified && (
                      <motion.div
                        className="mt-3 flex items-center gap-1.5 text-xs text-status-valid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45 }}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Integrity verified — data has not been modified
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Document details (public, limited) */}
                {result.title && (
                  <motion.div
                    className="verity-card p-5 mb-4"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-sm font-semibold text-warm-white mb-3">Document Information</h2>
                    <dl>
                      <VerifyField label="Title" value={result.title} />
                      <VerifyField
                        label="Type"
                        value={result.documentType ? DOCUMENT_TYPE_LABELS[result.documentType] : undefined}
                      />
                      <VerifyField label="Holder" value={result.holderName} />
                      <VerifyField label="Issued By" value={result.issuingInstitution} />
                      <VerifyField label="Issue Date" value={formatDate(result.issueDate)} />
                      <VerifyField
                        label="Expiration"
                        value={result.expirationDate ? formatDate(result.expirationDate) : 'No expiration'}
                      />
                      {result.status === 'revoked' && result.revokedAt && (
                        <VerifyField
                          label="Revoked"
                          value={`${formatDate(result.revokedAt)} — ${result.revocationReason || 'No reason provided'}`}
                        />
                      )}
                    </dl>
                  </motion.div>
                )}

                {/* Verification metadata */}
                <motion.div
                  className="verity-card p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-warm-muted flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        Verified at {result.verifiedAt ? formatDate(result.verifiedAt, 'MMM d, yyyy HH:mm:ss') : '—'}
                      </p>
                      <p className="text-xs font-mono text-warm-muted/60">{verificationId}</p>
                    </div>
                    <a
                      href={`/verify/${verificationId}`}
                      className="flex items-center gap-1.5 text-xs text-emerald hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Re-verify
                    </a>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-4 text-center">
        <p className="text-xs text-warm-muted/50">
          Verity — Digital Document Verification Platform · Trust, verified.
        </p>
      </footer>
    </div>
  );
}
