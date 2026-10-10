import { Router } from 'express';
import { param } from 'express-validator';
import { verifyDocument } from '../controllers/verification.controller';
import { validate } from '../middleware/validate';
import rateLimit from 'express-rate-limit';

const router = Router();

// Stricter rate limit for public verification endpoint
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Too many verification requests. Please try again later.' },
});

/**
 * @swagger
 * /api/verify/{verificationId}:
 *   get:
 *     summary: Publicly verify a document by its verification ID
 *     tags: [Verification]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: verificationId
 *         required: true
 *         schema: { type: string }
 *         description: The unique public verification ID (e.g., VRT-xxx-xxx)
 *     responses:
 *       200:
 *         description: Verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [valid, revoked, expired, suspended, not_found, integrity_failed]
 *                 verificationId: { type: string }
 *                 title: { type: string }
 *                 documentType: { type: string }
 *                 holderName: { type: string }
 *                 issuingInstitution: { type: string }
 *                 issueDate: { type: string }
 *                 expirationDate: { type: string }
 *                 integrityVerified: { type: boolean }
 *                 verifiedAt: { type: string }
 *       400:
 *         description: Invalid verification ID
 *       404:
 *         description: Document not found
 */
router.get(
  '/:verificationId',
  verifyLimiter,
  [
    param('verificationId')
      .trim()
      .notEmpty()
      .withMessage('Verification ID is required')
      .isLength({ max: 100 })
      .withMessage('Verification ID too long'),
    validate,
  ],
  verifyDocument
);

export default router;
