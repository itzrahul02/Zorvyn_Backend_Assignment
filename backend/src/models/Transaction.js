import mongoose from 'mongoose';

export const TRANSACTION_TYPES = ['income', 'expense'];

/** Aligned with common finance categories; includes rent for housing. */
export const TRANSACTION_CATEGORIES = [
  'salary',
  'bonus',
  'investment',
  'food',
  'transport',
  'utilities',
  'entertainment',
  'healthcare',
  'education',
  'rent',
  'other',
];

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      validate: {
        validator(v) {
          return typeof v === 'number' && v > 0;
        },
        message: 'Amount must be greater than 0',
      },
    },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    category: { type: String, enum: TRANSACTION_CATEGORIES, required: true, trim: true },
    date: { type: Date, required: true },
    notes: { type: String, default: '', trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

transactionSchema.pre('validate', function transactionDateRule(next) {
  if (this.date) {
    const d = new Date(this.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (d > today) {
      this.invalidate('date', 'Date cannot be in the future');
    }
  }
  next();
});

transactionSchema.index({ date: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ isDeleted: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
