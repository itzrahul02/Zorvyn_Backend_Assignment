import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';

/** PATCH: admin may edit any; analyst only own records; viewer blocked before this. */
export function requireTransactionPatchAccess() {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: 'Invalid id' });
      }
      const role = req.user.role;
      if (role === 'admin') return next();
      if (role === 'viewer') {
        return res.status(403).json({ error: 'Viewers cannot modify records' });
      }
      if (role === 'analyst') {
        const t = await Transaction.findOne({ _id: id, isDeleted: false }).select('createdBy');
        if (!t) return res.status(404).json({ error: 'Transaction not found' });
        if (t.createdBy.toString() !== req.user.id) {
          return res.status(403).json({ error: 'You can only edit your own records' });
        }
        return next();
      }
      return res.status(403).json({ error: 'Forbidden' });
    } catch (e) {
      next(e);
    }
  };
}
