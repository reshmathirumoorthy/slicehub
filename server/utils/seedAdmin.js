/**
 * Bootstrap helper to create an admin account.
 *
 * Usage:
 *   node utils/seedAdmin.js
 *
 * Optional env overrides:
 *   ADMIN_NAME ADMIN_EMAIL ADMIN_PASSWORD ADMIN_ROLE
 */
import mongoose from 'mongoose';
import env from '../config/env.js';
import Admin from '../models/Admin.js';
import { ADMIN_ROLES } from '../models/constants.js';

const seedAdmin = async () => {
  const name = process.env.ADMIN_NAME || 'SliceHub Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@slicehub.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin12345';
  const role = process.env.ADMIN_ROLE || ADMIN_ROLES.SUPER_ADMIN;

  await mongoose.connect(env.mongodbUri);

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const admin = await Admin.create({
    name,
    email,
    password,
    role,
    permissions: ['*'],
  });

  console.log('Admin created successfully:');
  console.log({
    id: admin._id.toString(),
    email: admin.email,
    role: admin.role,
  });

  await mongoose.disconnect();
};

seedAdmin().catch(async (error) => {
  console.error('Failed to seed admin:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
