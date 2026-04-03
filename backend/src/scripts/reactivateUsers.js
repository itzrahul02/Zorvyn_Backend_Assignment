/**
 * Sets all users to status "active" and fills missing status (dev recovery).
 * Usage: npm run reactivate-users
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

await connectDb(mongoUri);
const r = await User.updateMany(
  { $or: [{ status: { $exists: false } }, { status: 'inactive' }] },
  { $set: { status: 'active' } }
);
console.log(`Updated ${r.modifiedCount} user(s) to active.`);
await mongoose.disconnect();
