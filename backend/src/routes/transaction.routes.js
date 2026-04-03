import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { requireCapability } from '../middleware/rbac.js';
import { requireTransactionPatchAccess } from '../middleware/transactionAccess.js';
import { TRANSACTION_TYPES, TRANSACTION_CATEGORIES } from '../models/Transaction.js';
import * as transactionService from '../services/transaction.service.js';
import { getStatisticsForPeriod } from '../services/dashboard.service.js';

const router = Router();

function dateNotFuture(value) {
  const d = value instanceof Date ? value : new Date(value);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  if (d > end) throw new Error('Date cannot be in the future');
  return true;
}

const createFields = [
  body('amount').isFloat({ gt: 0 }),
  body('type').isIn(TRANSACTION_TYPES),
  body('category').isIn(TRANSACTION_CATEGORIES),
  body('date').isISO8601().toDate().custom(dateNotFuture),
  body('notes').optional().isString(),
];

router.use(requireAuth());

router.get(
  '/statistics',
  requireCapability('transactions:read'),
  query('start_date').isISO8601().toDate(),
  query('end_date').isISO8601().toDate(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid query', details: errors.array() });
      }
      const start = new Date(req.query.start_date);
      const end = new Date(req.query.end_date);
      end.setHours(23, 59, 59, 999);
      if (start > end) {
        return res.status(400).json({ error: 'start_date cannot be after end_date' });
      }
      const data = await getStatisticsForPeriod(start, end);
      res.json(data);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/bulk',
  requireCapability('transactions:create'),
  body('records').isArray({ min: 1 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid body', details: errors.array() });
      }
      const { records } = req.body;
      const result = await transactionService.bulkCreateTransactions(records, req.user.id);
      const status = result.errorCount === 0 ? 201 : 207;
      res.status(status).json(result);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/',
  requireCapability('transactions:read'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(TRANSACTION_TYPES),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid query', details: errors.array() });
      }
      const result = await transactionService.listTransactions(req.query);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/:id',
  requireCapability('transactions:read'),
  param('id').isMongoId(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid id', details: errors.array() });
      }
      const row = await transactionService.getById(req.params.id);
      if (!row) return res.status(404).json({ error: 'Transaction not found' });
      res.json(row);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/',
  requireCapability('transactions:create'),
  ...createFields,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      const row = await transactionService.createTransaction(req.body, req.user.id);
      res.status(201).json(row);
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/:id',
  requireTransactionPatchAccess(),
  param('id').isMongoId(),
  body('amount').optional().isFloat({ gt: 0 }),
  body('type').optional().isIn(TRANSACTION_TYPES),
  body('category').optional().isIn(TRANSACTION_CATEGORIES),
  body('date').optional().isISO8601().toDate().custom(dateNotFuture),
  body('notes').optional().isString(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      const row = await transactionService.updateTransaction(req.params.id, req.body);
      if (!row) return res.status(404).json({ error: 'Transaction not found' });
      res.json(row);
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/:id',
  requireCapability('transactions:delete'),
  param('id').isMongoId(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid id', details: errors.array() });
      }
      const result = await transactionService.softDeleteTransaction(req.params.id);
      if (!result) return res.status(404).json({ error: 'Transaction not found' });
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
