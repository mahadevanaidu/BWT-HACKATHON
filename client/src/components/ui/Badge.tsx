import { cn, getStatusClass, STATUS_LABELS } from '@/lib/utils';
import type { DocumentStatus, VerificationResultStatus } from '@/types';

interface BadgeProps {
  status: DocumentStatus | VerificationResultStatus;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

const DOT_COLORS: Record<string, string> = {
  valid: 'bg-status-valid',
  revoked: 'bg-status-revoked',
  expired: 'bg-status-expired',
  suspended: 'bg-status-suspended',
  not_found: 'bg-status-invalid',
  integrity_failed: 'bg-status-revoked',
};

export function StatusBadge({ status, size = 'md', showDot = true }: BadgeProps) {
  return (
    <span
      className={cn(
        'status-badge',
        getStatusClass(status),
        size === 'sm' && 'text-2xs px-2 py-0.5'
      )}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full inline-block', DOT_COLORS[status])} />
      )}
      {STATUS_LABELS[status] || status}
    </span>
  );
}
