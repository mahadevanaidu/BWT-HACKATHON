import { describe, it, expect } from 'vitest';
import { cn, formatDate, truncate, getStatusClass, DOCUMENT_TYPE_LABELS } from '@/lib/utils';

describe('cn (class merger)', () => {
  it('merges classes correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });
  it('handles conditional classes', () => {
    expect(cn('base', false && 'skipped', 'included')).toBe('base included');
  });
  it('deduplicates tailwind conflicts', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });
});

describe('formatDate', () => {
  it('formats a valid ISO string', () => {
    const result = formatDate('2024-01-15T00:00:00.000Z');
    expect(result).toMatch(/Jan/);
  });
  it('returns dash for null/undefined', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });
  it('returns dash for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('truncate', () => {
  it('truncates long strings and appends ellipsis', () => {
    const long = 'a'.repeat(50);
    const result = truncate(long, 20);
    // truncate(str, 20) → str.slice(0, 17) + '…' = 18 chars (slice + 1 char ellipsis)
    expect(result).toMatch(/…$/);
    expect(result.length).toBeLessThan(50);
  });
  it('does not truncate short strings', () => {
    expect(truncate('short', 20)).toBe('short');
  });
  it('truncates to exactly the right length', () => {
    const long = 'abcdefghijklmnopqrstuvwxyz';
    const result = truncate(long, 10);
    expect(result).toBe('abcdefg…');
  });
});

describe('getStatusClass', () => {
  it('maps valid status correctly', () => {
    expect(getStatusClass('valid')).toBe('status-valid');
    expect(getStatusClass('revoked')).toBe('status-revoked');
    expect(getStatusClass('expired')).toBe('status-expired');
  });
  it('returns invalid class for unknown status', () => {
    expect(getStatusClass('not_found' as 'valid')).toBe('status-invalid');
  });
});

describe('DOCUMENT_TYPE_LABELS', () => {
  it('has a label for every type', () => {
    const types = ['certificate', 'diploma', 'license', 'permit', 'id_card', 'transcript', 'contract', 'other'];
    types.forEach((t) => {
      expect(DOCUMENT_TYPE_LABELS[t as keyof typeof DOCUMENT_TYPE_LABELS]).toBeTruthy();
    });
  });
});
