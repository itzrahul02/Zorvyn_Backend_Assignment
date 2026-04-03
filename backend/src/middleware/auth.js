import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

function getBearerToken(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice(7);
}

export function requireAuth() {
  return async (req, res, next) => {
    try {
      const token = getBearerToken(req);
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }
      const payload = jwt.verify(token, secret);
      const user = await User.findById(payload.sub);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      if (user.status === 'inactive' || user.status === 'suspended') {
        return res.status(403).json({ error: 'Account is inactive or suspended' });
      }
      req.user = {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        name: user.name,
        status: user.status,
      };
      next();
    } catch (e) {
      if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      next(e);
    }
  };
}

export function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ sub: userId }, secret, { expiresIn });
}
