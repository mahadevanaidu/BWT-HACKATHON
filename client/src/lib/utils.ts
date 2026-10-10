import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import type { DocumentStatus, DocumentType, VerificationResultStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr?: string | null, fmt = 'MMM d, yyyy'): string {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    if (!isValid(d)) return '—';
    return format(d, fmt);
  } catch {
    return '—';
  }
}

export function formatRelative(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    if (!isValid(d)) return '—';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  certificate: 'Certificate',
  diploma: 'Diploma',
  license: 'License',
  permit: 'Permit',
  id_card: 'ID Card',
  transcript: 'Transcript',
  contract: 'Contract',
  other: 'Other',
};

export const STATUS_LABELS: Record<DocumentStatus | VerificationResultStatus, string> = {
  valid: 'Valid',
  revoked: 'Revoked',
  expired: 'Expired',
  suspended: 'Suspended',
  not_found: 'Not Found',
  integrity_failed: 'Integrity Failed',
};

export const DOCUMENT_TYPES: DocumentType[] = [
  'certificate', 'diploma', 'license', 'permit',
  'id_card', 'transcript', 'contract', 'other',
];

export function getStatusClass(status: DocumentStatus | VerificationResultStatus): string {
  switch (status) {
    case 'valid': return 'status-valid';
    case 'revoked': return 'status-revoked';
    case 'expired': return 'status-expired';
    case 'suspended': return 'status-suspended';
    default: return 'status-invalid';
  }
}

export function getStatusDot(status: DocumentStatus | VerificationResultStatus): string {
  switch (status) {
    case 'valid': return 'bg-status-valid';
    case 'revoked': return 'bg-status-revoked';
    case 'expired': return 'bg-status-expired';
    case 'suspended': return 'bg-status-suspended';
    default: return 'bg-status-invalid';
  }
}

export function truncate(str: string, len = 40): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 3) + '…';
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
