import { Router } from 'express';
import { getDashboardStats } from '../controllers/stats.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/stats/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Aggregated statistics for the dashboard
 */
router.get('/dashboard', authenticate, getDashboardStats);

export default router;
