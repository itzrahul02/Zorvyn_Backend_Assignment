import { Transaction } from '../models/Transaction.js';

const matchActive = { isDeleted: false };

export async function getSummary() {
  const [agg] = await Transaction.aggregate([
    { $match: matchActive },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
        },
        totalExpense: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
        },
      },
    },
  ]);

  const totalIncome = agg?.totalIncome ?? 0;
  const totalExpense = agg?.totalExpense ?? 0;

  const byCategory = await Transaction.aggregate([
    { $match: matchActive },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    categoryBreakdown: byCategory.map((r) => ({
      category: r._id.category,
      type: r._id.type,
      total: r.total,
    })),
  };
}

export async function getRecent(limit = 10) {
  const n = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const rows = await Transaction.find(matchActive)
    .sort({ date: -1, createdAt: -1 })
    .limit(n)
    .populate('createdBy', 'name email')
    .lean();

  return rows.map((t) => ({
    id: t._id,
    amount: t.amount,
    type: t.type,
    category: t.category,
    date: t.date,
    notes: t.notes,
    createdAt: t.createdAt,
    createdBy: t.createdBy
      ? { id: t.createdBy._id, name: t.createdBy.name, email: t.createdBy.email }
      : null,
  }));
}

/** groupBy: 'week' | 'month' */
export async function getTrends(groupBy = 'month', span = 12) {
  const gb = groupBy === 'week' ? 'week' : 'month';
  const now = new Date();
  const start = new Date(now);
  if (gb === 'month') {
    start.setMonth(start.getMonth() - (Number(span) || 12));
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(start.getDate() - 7 * (Number(span) || 12));
  }

  const groupStage =
    gb === 'month'
      ? {
          $group: {
            _id: {
              y: { $year: '$date' },
              m: { $month: '$date' },
              type: '$type',
            },
            total: { $sum: '$amount' },
          },
        }
      : {
          $group: {
            _id: {
              y: { $year: '$date' },
              w: { $isoWeek: '$date' },
              type: '$type',
            },
            total: { $sum: '$amount' },
          },
        };

  const rows = await Transaction.aggregate([
    { $match: { ...matchActive, date: { $gte: start } } },
    groupStage,
    {
      $sort:
        gb === 'month'
          ? { '_id.y': 1, '_id.m': 1, '_id.type': 1 }
          : { '_id.y': 1, '_id.w': 1, '_id.type': 1 },
    },
  ]);

  return {
    groupBy: gb,
    points: rows.map((r) => ({
      period:
        gb === 'month'
          ? { year: r._id.y, month: r._id.m }
          : { year: r._id.y, isoWeek: r._id.w },
      type: r._id.type,
      total: r.total,
    })),
  };
}

export async function getStatisticsForPeriod(start, end) {
  const filter = {
    isDeleted: false,
    date: { $gte: start, $lte: end },
  };
  const records = await Transaction.find(filter).lean();
  const totalRecords = records.length;
  let totalIncome = 0;
  let totalExpense = 0;
  for (const r of records) {
    if (r.type === 'income') totalIncome += r.amount;
    else totalExpense += r.amount;
  }
  const sum = totalIncome + totalExpense;
  return {
    startDate: start,
    endDate: end,
    totalRecords,
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    averagePerRecord: totalRecords > 0 ? sum / totalRecords : 0,
  };
}
