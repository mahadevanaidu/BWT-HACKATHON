import { Response, NextFunction } from 'express';
import { DocumentModel } from '../models/Document.model';
import { VerificationLog } from '../models/VerificationLog.model';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getDashboardStats(
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Document counts by status
    const [statusCounts, totalVerifications, recentVerifications] = await Promise.all([
      DocumentModel.aggregate([
        {
          $facet: {
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
            ],
            total: [{ $count: 'count' }],
            expiringSoon: [
              {
                $match: {
                  status: 'valid',
                  expirationDate: {
                    $gte: now,
                    $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                  },
                },
              },
              { $count: 'count' },
            ],
            recentlyIssued: [
              { $match: { createdAt: { $gte: thirtyDaysAgo } } },
              { $count: 'count' },
            ],
          },
        },
      ]),
      VerificationLog.countDocuments(),
      VerificationLog.countDocuments({ requestedAt: { $gte: sevenDaysAgo } }),
    ]);

    const stats = statusCounts[0];
    const byStatus: Record<string, number> = {};
    for (const s of stats.byStatus) {
      byStatus[s._id] = s.count;
    }

    const total = stats.total[0]?.count || 0;
    const expiringSoon = stats.expiringSoon[0]?.count || 0;
    const recentlyIssued = stats.recentlyIssued[0]?.count || 0;

    // Verification trend: last 14 days
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const verificationTrend = await VerificationLog.aggregate([
      { $match: { requestedAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$requestedAt' },
          },
          count: { $sum: 1 },
          valid: {
            $sum: { $cond: [{ $eq: ['$resultStatus', 'valid'] }, 1, 0] },
          },
          failed: {
            $sum: {
              $cond: [
                { $in: ['$resultStatus', ['revoked', 'expired', 'not_found', 'integrity_failed']] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Recent activity (latest 10 verifications with some doc info)
    const recentActivity = await VerificationLog.find()
      .sort({ requestedAt: -1 })
      .limit(10)
      .populate({
        path: 'documentId',
        select: 'title holderName verificationId',
      })
      .lean();

    // Document type distribution
    const typeDistribution = await DocumentModel.aggregate([
      { $group: { _id: '$documentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      documents: {
        total,
        valid: byStatus['valid'] || 0,
        revoked: byStatus['revoked'] || 0,
        expired: byStatus['expired'] || 0,
        suspended: byStatus['suspended'] || 0,
        expiringSoon,
        recentlyIssued,
      },
      verifications: {
        total: totalVerifications,
        lastSevenDays: recentVerifications,
      },
      verificationTrend,
      recentActivity,
      typeDistribution,
    });
  } catch (err) {
    next(err);
  }
}
