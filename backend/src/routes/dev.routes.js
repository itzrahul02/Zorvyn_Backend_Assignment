import express from 'express';
import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';

const router = express.Router();

// Dev-only: return tokens for seeded users to simplify testing in Swagger UI
router.get('/dev/tokens', async (req, res, next) => {
  try {
    if ((process.env.NODE_ENV || 'development') !== 'development') {
      return res.status(404).json({ error: 'Not found' });
    }

    const emails = ['admin@example.com', 'analyst@example.com', 'viewer@example.com'];
    const out = {};
    for (const email of emails) {
      const user = await User.findOne({ email }).lean();
      if (!user) continue;
      out[email.split('@')[0]] = signToken(user._id.toString());
    }

    res.json(out);
  } catch (err) {
    next(err);
  }
});

export default router;
