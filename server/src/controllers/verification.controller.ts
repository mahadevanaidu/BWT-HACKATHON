import { Request, Response, NextFunction } from 'express';
import { DocumentModel } from '../models/Document.model';
import { VerificationLog } from '../models/VerificationLog.model';
import { verifyIntegrityHash } from '../utils/crypto';
import logger from '../utils/logger';

/**
 * Public endpoint — verifies a document by its verificationId.
 * Does NOT require authentication.
 * Returns minimal information to avoid exposing sensitive data.
 */
export async function verifyDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { verificationId } = req.params;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!verificationId || verificationId.length > 100) {
      res.status(400).json({
        status: 'invalid',
        error: 'Invalid verification ID format.',
      });
      return;
    }

    const doc = await DocumentModel.findOne({ verificationId });

    // Document not found
    if (!doc) {
      await VerificationLog.create({
        verificationId,
        requestedAt: new Date(),
        ipAddress,
        userAgent,
        resultStatus: 'not_found',
        integrityPassed: false,
      });

      res.status(404).json({
        status: 'not_found',
        message: 'No document found with this verification ID.',
      });
      return;
    }

    // Verify integrity hash
    const integrityPassed = verifyIntegrityHash(
      {
        verificationId: doc.verificationId,
        title: doc.title,
        documentType: doc.documentType,
        holderName: doc.holderName,
        issuingInstitution: doc.issuingInstitution,
        issueDate: doc.issueDate.toISOString(),
        expirationDate: doc.expirationDate?.toISOString() ?? null,
      },
      doc.integrityHash
    );

    if (!integrityPassed) {
      await VerificationLog.create({
        verificationId,
        documentId: doc._id,
        requestedAt: new Date(),
        ipAddress,
        userAgent,
        resultStatus: 'integrity_failed',
        integrityPassed: false,
      });

      logger.warn(`Integrity check FAILED for document: ${verificationId}`);

      res.status(200).json({
        status: 'integrity_failed',
        message: 'Document integrity check failed. This document may have been tampered with.',
        verificationId,
      });
      return;
    }

    // Compute effective status (accounts for expiration)
    const effectiveStatus = doc.effectiveStatus;

    // Update expired status in DB if needed
    if (effectiveStatus === 'expired' && doc.status !== 'expired') {
      await DocumentModel.updateOne({ _id: doc._id }, { status: 'expired' });
    }

    // Log verification
    await VerificationLog.create({
      verificationId,
      documentId: doc._id,
      requestedAt: new Date(),
      ipAddress,
      userAgent,
      resultStatus: effectiveStatus,
      integrityPassed: true,
    });

    // Public response — minimal, no sensitive data
    const publicResponse = {
      status: effectiveStatus,
      verificationId: doc.verificationId,
      title: doc.title,
      documentType: doc.documentType,
      holderName: doc.holderName,
      issuingInstitution: doc.issuingInstitution,
      issueDate: doc.issueDate.toISOString(),
      expirationDate: doc.expirationDate?.toISOString() ?? null,
      integrityVerified: true,
      verifiedAt: new Date().toISOString(),
      ...(effectiveStatus === 'revoked' && {
        revokedAt: doc.revokedAt?.toISOString(),
        revocationReason: doc.revocationReason,
      }),
    };

    res.json(publicResponse);
  } catch (err) {
    next(err);
  }
}

/**
 * Get verification history for a document (admin only).
 */
export async function getVerificationHistory(
  req: Request,
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

    const logs = await VerificationLog.find({ documentId: doc._id })
      .sort({ requestedAt: -1 })
      .limit(100)
      .lean();

    res.json({ logs });
  } catch (err) {
    next(err);
  }
}
