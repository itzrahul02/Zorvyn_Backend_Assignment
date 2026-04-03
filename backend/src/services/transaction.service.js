import mongoose from 'mongoose';
import { Transaction, TRANSACTION_CATEGORIES } from '../models/Transaction.js';

/**
 * Transaction service
 * Contains helpers for listing, creating and updating transactions.
 * These functions are deliberately small and focused to make testing easier.
 */

function buildFilter(query) {
  const filter = { isDeleted: false };

  if (query.type && ['income', 'expense'].includes(query.type)) {
    filter.type = query.type;
  }
  if (query.category && String(query.category).trim()) {
    const c = String(query.category).trim();
    if (TRANSACTION_CATEGORIES.includes(c)) {
      filter.category = c;
    } else {
      filter.category = new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
  }
  if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) {
      const d = new Date(query.dateFrom);
      if (!Number.isNaN(d.getTime())) filter.date.$gte = d;
    }
    if (query.dateTo) {
      const d = new Date(query.dateTo);
      if (!Number.isNaN(d.getTime())) filter.date.$lte = d;
    }
    if (Object.keys(filter.date).length === 0) delete filter.date;
  }
  if (query.q && String(query.q).trim()) {
    const term = String(query.q).trim();
    filter.$or = [
      { category: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { notes: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    ];
  }

  return filter;
}

export async function listTransactions(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;
  const filter = buildFilter(query);

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  return {
    data: items.map((t) => ({
      id: t._id,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date,
      notes: t.notes,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      createdBy: t.createdBy
        ? { id: t.createdBy._id, name: t.createdBy.name, email: t.createdBy.email }
        : null,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getById(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const t = await Transaction.findOne({ _id: id, isDeleted: false }).populate(
    'createdBy',
    'name email'
  );
  if (!t) return null;
  const o = t.toObject();
  return {
    id: o._id,
    amount: o.amount,
    type: o.type,
    category: o.category,
    date: o.date,
    notes: o.notes,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    createdBy: o.createdBy
      ? { id: o.createdBy._id, name: o.createdBy.name, email: o.createdBy.email }
      : null,
  };
}

export async function createTransaction(payload, userId) {
  const doc = await Transaction.create({
    amount: payload.amount,
    type: payload.type,
    category: payload.category,
    date: payload.date,
    notes: payload.notes ?? '',
    createdBy: userId,
  });
  return getById(doc._id.toString());
}

export async function updateTransaction(id, payload) {
  if (!mongoose.isValidObjectId(id)) return null;
  const t = await Transaction.findOne({ _id: id, isDeleted: false });
  if (!t) return null;
  if (payload.amount !== undefined) t.amount = payload.amount;
  if (payload.type !== undefined) t.type = payload.type;
  if (payload.category !== undefined) t.category = payload.category;
  if (payload.date !== undefined) t.date = payload.date;
  if (payload.notes !== undefined) t.notes = payload.notes;
  await t.save();
  return getById(id);
}

export async function softDeleteTransaction(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const t = await Transaction.findOne({ _id: id, isDeleted: false });
  if (!t) return null;
  t.isDeleted = true;
  t.deletedAt = new Date();
  await t.save();
  return { id: t._id.toString(), deleted: true };
}

export async function bulkCreateTransactions(items, userId) {
  const created = [];
  const errors = [];
  for (let i = 0; i < items.length; i++) {
    try {
      const row = await createTransaction(items[i], userId);
      created.push(row);
    } catch (e) {
      errors.push({ index: i, error: e.message || 'Validation failed' });
    }
  }
  return { created, errors, createdCount: created.length, errorCount: errors.length };
}
