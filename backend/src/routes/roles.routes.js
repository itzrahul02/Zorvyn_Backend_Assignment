import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireCapability } from '../middleware/rbac.js';
import { ROLES } from '../models/User.js';

const router = Router();

router.use(requireAuth());
router.use(requireCapability('users:manage'));

/**
 * @openapi
 * /api/roles:
 *   get:
 *     summary: List roles and descriptions
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Roles
 */
router.get('/', (req, res) => {
  res.json({
    roles: ROLES.map((name) => ({
      name,
      description:
        name === 'viewer'
          ? 'Read dashboard and all transactions; no edits'
          : name === 'analyst'
            ? 'Read all data; create and edit own transactions'
            : 'Full access including user management and deletes',
    })),
  });
});

export default router;
