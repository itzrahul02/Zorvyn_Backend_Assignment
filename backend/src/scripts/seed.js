import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

await connectDb(mongoUri);

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const adminPass = process.env.SEED_ADMIN_PASSWORD || 'adminadmin';

let admin = await User.findOne({ email: adminEmail });
if (!admin) {
  const passwordHash = await User.hashPassword(adminPass);
  admin = await User.create({
    email: adminEmail,
    passwordHash,
    name: 'Admin',
    role: 'admin',
    status: 'active',
  });
  console.log('Created admin:', adminEmail);
} else {
  console.log('Admin exists:', adminEmail);
}

const analystEmail = 'analyst@example.com';
let analyst = await User.findOne({ email: analystEmail });
if (!analyst) {
  analyst = await User.create({
    email: analystEmail,
    passwordHash: await User.hashPassword('analyst12'),
    name: 'Analyst User',
    role: 'analyst',
    status: 'active',
  });
  console.log('Created analyst:', analystEmail);
}

const viewerEmail = 'viewer@example.com';
let viewer = await User.findOne({ email: viewerEmail });
if (!viewer) {
  viewer = await User.create({
    email: viewerEmail,
    passwordHash: await User.hashPassword('viewer1234'),
    name: 'Viewer User',
    role: 'viewer',
    status: 'active',
  });
  console.log('Created viewer:', viewerEmail);
}

const count = await Transaction.countDocuments({ isDeleted: false });
if (count === 0) {
  const now = new Date();
  function daysAgo(days) {
    const d = new Date(now);
    d.setDate(now.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  await Transaction.insertMany([
    {
      amount: 5000,
      type: 'income',
      category: 'salary',
      date: daysAgo(10),
      notes: 'Monthly salary',
      createdBy: admin._id,
    },
    {
      amount: 1200,
      type: 'expense',
      category: 'rent',
      date: daysAgo(7),
      notes: 'Rent',
      createdBy: admin._id,
    },
    {
      amount: 350,
      type: 'expense',
      category: 'food',
      date: daysAgo(5),
      notes: 'Groceries',
      createdBy: admin._id,
    },
  ]);
  console.log('Seeded sample transactions');
}

await mongoose.disconnect();
console.log('Done.');
