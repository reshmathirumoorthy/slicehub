/**
 * Local helper: mint a fresh verification token for an existing user (testing only).
 * Does not send email. Usage:
 *   node utils/mintVerificationToken.js user@example.com [outfile]
 * Writes the raw token to outfile (recommended) or stdout.
 */
import fs from 'fs';
import mongoose from 'mongoose';
import crypto from 'crypto';
import env from '../config/env.js';
import User from '../models/User.js';
import { hashToken } from '../utils/tokenCrypto.js';

const email = String(process.argv[2] || '')
  .toLowerCase()
  .trim();
const outFile = process.argv[3] ? String(process.argv[3]) : null;

if (!email) {
  console.error('Usage: node utils/mintVerificationToken.js <email> [outfile]');
  process.exit(1);
}

await mongoose.connect(env.mongodbUri);
const user = await User.findOne({ email });
if (!user) {
  console.error('User not found');
  await mongoose.disconnect();
  process.exit(1);
}

const raw = crypto.randomBytes(32).toString('hex');
user.emailVerificationToken = hashToken(raw);
user.emailVerificationExpires = new Date(Date.now() + 60 * 60 * 1000);
user.isEmailVerified = false;
await user.save({ validateBeforeSave: false });

if (outFile) {
  fs.writeFileSync(outFile, raw, 'utf8');
} else {
  process.stdout.write(raw);
}

await mongoose.disconnect();
