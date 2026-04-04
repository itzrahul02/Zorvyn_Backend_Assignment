import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /api/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags:
 *       - Me
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 */
router.get('/', requireAuth(), (req, res) => {
  res.json({ user: req.user });
});

export default router;
