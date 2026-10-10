import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createDocument,
  listDocuments,
  getDocument,
  updateDocument,
  revokeDocument,
  regenerateQRCode,
  deleteDocument,
} from '../controllers/document.controller';
import { getVerificationHistory } from '../controllers/verification.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';

const router = Router();

// All document routes require authentication
router.use(authenticate);

const DOCUMENT_TYPES = ['certificate', 'diploma', 'license', 'permit', 'id_card', 'transcript', 'contract', 'other'];

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: List and search documents
 *     tags: [Documents]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search query (title, holder, institution, ID)
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [valid, revoked, expired, suspended] }
 *       - in: query
 *         name: documentType
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of documents with pagination
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['valid', 'revoked', 'expired', 'suspended']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    validate,
  ],
  listDocuments
);

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Issue a new document
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, documentType, holderName, issuingInstitution, issueDate]
 *             properties:
 *               title: { type: string }
 *               documentType: { type: string, enum: [certificate, diploma, license, permit, id_card, transcript, contract, other] }
 *               holderName: { type: string }
 *               holderEmail: { type: string }
 *               issuingInstitution: { type: string }
 *               issueDate: { type: string, format: date }
 *               expirationDate: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Document created
 */
router.post(
  '/',
  requireRole('admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('documentType').isIn(DOCUMENT_TYPES).withMessage('Invalid document type'),
    body('holderName').trim().notEmpty().withMessage('Holder name is required'),
    body('holderEmail').optional().isEmail().normalizeEmail(),
    body('issuingInstitution').trim().notEmpty().withMessage('Issuing institution is required'),
    body('issueDate').isISO8601().withMessage('Valid issue date is required'),
    body('expirationDate').optional({ nullable: true }).isISO8601().withMessage('Valid expiration date required'),
    body('description').optional().isLength({ max: 1000 }),
    validate,
  ],
  createDocument
);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document details
 *       404:
 *         description: Not found
 */
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid document ID'),
    validate,
  ],
  getDocument
);

/**
 * @swagger
 * /api/documents/{id}:
 *   patch:
 *     summary: Update document fields
 *     tags: [Documents]
 */
router.patch(
  '/:id',
  requireRole('admin'),
  [
    param('id').isMongoId().withMessage('Invalid document ID'),
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('holderName').optional().trim().notEmpty(),
    body('holderEmail').optional().isEmail().normalizeEmail(),
    body('issuingInstitution').optional().trim().notEmpty(),
    body('issueDate').optional().isISO8601(),
    body('expirationDate').optional({ nullable: true }).isISO8601(),
    body('description').optional().isLength({ max: 1000 }),
    validate,
  ],
  updateDocument
);

/**
 * @swagger
 * /api/documents/{id}/revoke:
 *   post:
 *     summary: Revoke a document
 *     tags: [Documents]
 */
router.post(
  '/:id/revoke',
  requireRole('admin'),
  [
    param('id').isMongoId().withMessage('Invalid document ID'),
    body('reason').optional().isString().isLength({ max: 500 }),
    validate,
  ],
  revokeDocument
);

/**
 * @swagger
 * /api/documents/{id}/qrcode:
 *   post:
 *     summary: Regenerate QR code
 *     tags: [Documents]
 */
router.post(
  '/:id/qrcode',
  requireRole('admin'),
  [param('id').isMongoId().withMessage('Invalid document ID'), validate],
  regenerateQRCode
);

/**
 * @swagger
 * /api/documents/{id}/history:
 *   get:
 *     summary: Get verification history
 *     tags: [Documents]
 */
router.get(
  '/:id/history',
  [param('id').isMongoId().withMessage('Invalid document ID'), validate],
  getVerificationHistory
);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete document permanently
 *     tags: [Documents]
 */
router.delete(
  '/:id',
  requireRole('admin'),
  [param('id').isMongoId().withMessage('Invalid document ID'), validate],
  deleteDocument
);

export default router;
