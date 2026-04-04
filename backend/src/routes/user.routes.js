import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { requireCapability } from '../middleware/rbac.js';
import { ROLES, USER_STATUS } from '../models/User.js';
import * as userService from '../services/user.service.js';

const router = Router();

router.use(requireAuth());
router.use(requireCapability('users:manage'));

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: List users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User list
 */
router.get('/', async (req, res, next) => {
  try {
    const users = await userService.listUsers();
    res.json({ users });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Create a user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *           examples:
 *             newUser:
 *               summary: Create user example
 *               value:
 *                 email: newuser@example.com
 *                 password: password123
 *                 name: New User
 *     responses:
 *       '201':
 *         description: Created
 */
router.post(
  '/',
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 8 }),
  body('name').isString().trim().notEmpty(),
  body('role').optional().isIn(ROLES),
  body('status').optional().isIn(USER_STATUS),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      const user = await userService.createUser(req.body);
      res.status(201).json(user);
    } catch (e) {
      if (e.statusCode === 409) {
        return res.status(409).json({ error: e.message });
      }
      next(e);
    }
  }
);

/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     summary: Update user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Updated
 */
router.patch(
  '/:id',
  param('id').isMongoId(),
  body('name').optional().isString().trim().notEmpty(),
  body('role').optional().isIn(ROLES),
  body('status').optional().isIn(USER_STATUS),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      if (req.params.id === req.user.id && req.body.status === 'inactive') {
        return res.status(400).json({ error: 'You cannot deactivate your own account' });
      }
      const user = await userService.updateUser(req.params.id, req.body);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
