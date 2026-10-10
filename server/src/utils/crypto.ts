import crypto from 'crypto';

/**
 * Fields included in the document integrity hash.
 * Changing these fields requires re-issuing the integrity hash.
 */
export interface HashableDocumentFields {
  verificationId: string;
  title: string;
  documentType: string;
  holderName: string;
  issuingInstitution: string;
  issueDate: string; // ISO string
  expirationDate?: string | null;
}

/**
 * Computes a deterministic SHA-256 integrity hash over protected document fields.
 * Fields are sorted alphabetically to ensure determinism regardless of object key order.
 */
export function computeIntegrityHash(fields: HashableDocumentFields): string {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(fields).sort() as (keyof HashableDocumentFields)[];

  for (const key of keys) {
    const val = fields[key];
    if (val !== undefined && val !== null) {
      sorted[key] = String(val);
    }
  }

  const canonical = JSON.stringify(sorted);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Verifies that the stored hash matches a freshly computed hash for the given fields.
 */
export function verifyIntegrityHash(
  fields: HashableDocumentFields,
  storedHash: string
): boolean {
  const computed = computeIntegrityHash(fields);
  // Use timingSafeEqual to prevent timing attacks
  const computedBuf = Buffer.from(computed, 'hex');
  const storedBuf = Buffer.from(storedHash, 'hex');

  if (computedBuf.length !== storedBuf.length) return false;

  return crypto.timingSafeEqual(computedBuf, storedBuf);
}

/**
 * Generates a cryptographically secure random verification ID.
 * Format: VRT-<timestamp_base36>-<random_hex>
 */
export function generateVerificationId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `VRT-${timestamp}-${random}`;
}
