import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { requireCapability } from '../middleware/rbac.js';
import * as dashboardService from '../services/dashboard.service.js';

const router = Router();

router.use(requireAuth());
router.use(requireCapability('dashboard:read'));

router.get('/summary', async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary();
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get(
  '/recent',
  query('limit').optional().isInt({ min: 1, max: 50 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid query', details: errors.array() });
      }
      const data = await dashboardService.getRecent(req.query.limit);
      res.json({ items: data });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/trends',
  query('groupBy').optional().isIn(['month', 'week']),
  query('span').optional().isInt({ min: 1, max: 60 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid query', details: errors.array() });
      }
      const data = await dashboardService.getTrends(
        req.query.groupBy || 'month',
        req.query.span
      );
      res.json(data);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
