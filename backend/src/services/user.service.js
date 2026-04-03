import mongoose from 'mongoose';
import { User } from '../models/User.js';

export async function listUsers() {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  return users.map((u) => ({
    id: u._id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
  }));
}

export async function createUser({ email, password, name, role, status }) {
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    name,
    role: role || 'viewer',
    status: status || 'active',
  });
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };
}

export async function updateUser(id, { name, role, status }) {
  if (!mongoose.isValidObjectId(id)) return null;
  const user = await User.findById(id);
  if (!user) return null;
  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (status !== undefined) user.status = status;
  await user.save();
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };
}
