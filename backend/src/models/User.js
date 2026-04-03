import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['viewer', 'analyst', 'admin'];
export const USER_STATUS = ['active', 'inactive', 'suspended'];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ROLES,
      default: 'viewer',
    },
    status: {
      type: String,
      enum: USER_STATUS,
      default: 'active',
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

export const User = mongoose.model('User', userSchema);
