import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

await connectDb(mongoUri);

const email = process.argv[2] || process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const user = await User.findOne({ email }).lean();
if (!user) {
  console.error('User not found:', email);
  process.exit(1);
}

const token = signToken(user._id.toString());
console.log(token);

await mongoose.disconnect();
