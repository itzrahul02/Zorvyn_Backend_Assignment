import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and return JWT
 *     tags:
 *       - Auth
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
 *           examples:
 *             admin:
 *               summary: Admin credentials
 *               value:
 *                 email: admin@example.com
 *                 password: adminadmin
 *     responses:
 *       '200':
 *         description: Authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 */
router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 1 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      if (user.status === 'inactive' || user.status === 'suspended') {
        return res.status(403).json({ error: 'Account is inactive or suspended' });
      }
      const ok = await user.comparePassword(password);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const token = signToken(user._id.toString());
      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
