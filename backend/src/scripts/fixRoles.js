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

async function setRole(email, role) {
  const u = await User.findOne({ email });
  if (!u) {
    console.log(`User not found: ${email}`);
    return;
  }
  if (u.role === role) {
    console.log(`OK: ${email} already has role ${role}`);
    return;
  }
  u.role = role;
  await u.save();
  console.log(`Updated ${email} -> ${role}`);
}

await setRole('analyst@example.com', 'analyst');
await setRole('viewer@example.com', 'viewer');
await setRole('admin@example.com', 'admin');

await mongoose.disconnect();
console.log('Done');
process.exit(0);
