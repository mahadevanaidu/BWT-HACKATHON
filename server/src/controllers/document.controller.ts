import { Response, NextFunction } from 'express';
import { DocumentModel, DocumentStatus } from '../models/Document.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { computeIntegrityHash, generateVerificationId } from '../utils/crypto';
import { generateQRCode, getVerificationUrl } from '../utils/qrcode';
import logger from '../utils/logger';

// ─── Create Document ──────────────────────────────────────────────────────────

export async function createDocument(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      title,
      documentType,
      holderName,
      holderEmail,
      issuingInstitution,
      issuerDepartment,
      issueDate,
      expirationDate,
      description,
      metadata,
      tags,
    } = req.body;

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const verificationId = generateVerificationId();
    const issueDateObj = new Date(issueDate);
    const expirationDateObj = expirationDate ? new Date(expirationDate) : null;

    // Compute integrity hash over protected fields
    const integrityHash = computeIntegrityHash({
      verificationId,
      title,
      documentType,
      holderName,
      issuingInstitution,
      issueDate: issueDateObj.toISOString(),
      expirationDate: expirationDateObj?.toISOString() ?? null,
    });

    // Generate QR code
    const { dataUrl: qrCodeDataUrl } = await generateQRCode(verificationId);
    const verificationUrl = getVerificationUrl(verificationId);

    const doc = await DocumentModel.create({
      verificationId,
      title,
      documentType,
      holderName,
      holderEmail,
      issuingInstitution,
      issuerDepartment,
      issueDate: issueDateObj,
      expirationDate: expirationDateObj,
      description,
      metadata,
      tags,
      status: 'valid',
      integrityHash,
      qrCodeDataUrl,
      verificationUrl,
      issuedBy: req.user._id,
    });

    logger.info(`Document created: ${verificationId} by ${req.user.email}`);

    res.status(201).json({ document: doc });
  } catch (err) {
    next(err);
  }
}

// ─── List / Search Documents ──────────────────────────────────────────────────

export async function listDocuments(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      q,
      status,
      documentType,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (documentType) query.documentType = documentType;

    // Text search
    if (q) {
      const regex = new RegExp(q, 'i');
      query.$or = [
        { title: regex },
        { holderName: regex },
        { verificationId: regex },
        { issuingInstitution: regex },
      ];
    }

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'holderName', 'issueDate', 'status'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [documents, total] = await Promise.all([
      DocumentModel.find(query)
        .populate('issuedBy', 'name email')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitNum)
        .lean({ virtuals: true }),
      DocumentModel.countDocuments(query),
    ]);

    res.json({
      documents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get Document by ID ───────────────────────────────────────────────────────

export async function getDocument(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const doc = await DocumentModel.findById(id)
      .populate('issuedBy', 'name email')
      .populate('revokedBy', 'name email')
      .lean({ virtuals: true });

    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    res.json({ document: doc });
  } catch (err) {
    next(err);
  }
}

// ─── Update Document ──────────────────────────────────────────────────────────

export async function updateDocument(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const doc = await DocumentModel.findById(id);
    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    // Revoked documents cannot be edited through this route
    if (doc.status === 'revoked') {
      res.status(403).json({
        error: 'Revoked documents cannot be edited. Use the restore endpoint to re-activate.',
      });
      return;
    }

    const allowedFields = [
      'title', 'holderName', 'holderEmail', 'issuingInstitution',
      'issuerDepartment', 'description', 'metadata', 'tags',
      'issueDate', 'expirationDate',
    ];

    // Apply allowed updates (use type assertion to bypass strict index check)
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (doc as any)[field] = req.body[field];
      }
    }

    // Recompute integrity hash when protected fields change
    const hashableFieldsChanged = [
      'title', 'holderName', 'issuingInstitution', 'issueDate', 'expirationDate',
    ].some((f) => req.body[f] !== undefined);

    if (hashableFieldsChanged) {
      doc.integrityHash = computeIntegrityHash({
        verificationId: doc.verificationId,
        title: doc.title,
        documentType: doc.documentType,
        holderName: doc.holderName,
        issuingInstitution: doc.issuingInstitution,
        issueDate: doc.issueDate.toISOString(),
        expirationDate: doc.expirationDate?.toISOString() ?? null,
      });
    }

    await doc.save();

    logger.info(`Document updated: ${doc.verificationId} by ${req.user.email}`);

    res.json({ document: doc.toJSON() });
  } catch (err) {
    next(err);
  }
}

// ─── Revoke Document ──────────────────────────────────────────────────────────

export async function revokeDocument(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const doc = await DocumentModel.findById(id);
    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    if (doc.status === 'revoked') {
      res.status(409).json({ error: 'Document is already revoked.' });
      return;
    }

    doc.status = 'revoked' as DocumentStatus;
    doc.revokedAt = new Date();
    doc.revokedBy = req.user._id as unknown as typeof doc.revokedBy;
    doc.revocationReason = reason || 'Revoked by administrator.';

    await doc.save();

    logger.info(`Document revoked: ${doc.verificationId} by ${req.user.email}. Reason: ${doc.revocationReason}`);

    res.json({
      message: 'Document revoked successfully.',
      document: doc.toJSON(),
    });
  } catch (err) {
    next(err);
  }
}

// ─── Regenerate QR Code ───────────────────────────────────────────────────────

export async function regenerateQRCode(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const doc = await DocumentModel.findById(id);
    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    const { dataUrl } = await generateQRCode(doc.verificationId);
    doc.qrCodeDataUrl = dataUrl;
    doc.verificationUrl = getVerificationUrl(doc.verificationId);

    await doc.save();

    res.json({
      qrCodeDataUrl: doc.qrCodeDataUrl,
      verificationUrl: doc.verificationUrl,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Delete Document ──────────────────────────────────────────────────────────

export async function deleteDocument(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const doc = await DocumentModel.findByIdAndDelete(id);
    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    logger.info(`Document deleted: ${doc.verificationId} by ${req.user.email}`);

    res.json({ message: 'Document deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
