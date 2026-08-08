/**
 * Bootstrap helper to create an admin account.
 *
 * Usage:
 *   node utils/seedAdmin.js
 *   node utils/seedAdmin.js --reset-password
 *
 * Optional env overrides:
 *   ADMIN_NAME ADMIN_EMAIL ADMIN_PASSWORD ADMIN_ROLE
 *
 * Important: if an admin already exists, this script does NOT change the
 * password unless you pass --reset-password (or ADMIN_PASSWORD_RESET=true).
 * Changing ADMIN_PASSWORD in .env alone will not update MongoDB.
 */
import mongoose from 'mongoose';
import env from '../config/env.js';
import Admin from '../models/Admin.js';
import { ADMIN_ROLES } from '../models/constants.js';

const shouldResetPassword =
  process.argv.includes('--reset-password') ||
  String(process.env.ADMIN_PASSWORD_RESET || '').toLowerCase() === 'true';

const seedAdmin = async () => {
  const name = process.env.ADMIN_NAME || 'SliceHub Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@slicehub.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin12345';
  const role = process.env.ADMIN_ROLE || ADMIN_ROLES.SUPER_ADMIN;

  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      '[seed:admin] ADMIN_PASSWORD is not set — using the development default. Set ADMIN_PASSWORD before any shared or production deploy.',
    );
  }
  await mongoose.connect(env.mongodbUri);

  const existing = await Admin.findOne({ email }).select('+password');
  if (existing) {
    if (shouldResetPassword) {
      existing.password = password;
      if (name) existing.name = name;
      if (role) existing.role = role;
      existing.isActive = true;
      await existing.save();
      console.log(`Admin password reset for: ${email}`);
      console.log({
        id: existing._id.toString(),
        email: existing.email,
        role: existing.role,
        isActive: existing.isActive,
      });
      await mongoose.disconnect();
      return;
    }

    console.log(`Admin already exists: ${email}`);
    console.warn(
      '[seed:admin] Password was NOT changed. To update it, run: npm run seed:admin -- --reset-password',
    );
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
