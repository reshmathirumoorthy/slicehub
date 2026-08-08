import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter;
let transporterKey = null;

const PLACEHOLDER_HOSTS = new Set([
  '',
  'smtp.example.com',
  'localhost',
  '127.0.0.1',
]);

const PLACEHOLDER_USERS = new Set([
  '',
  'your_email@example.com',
  'user@example.com',
]);

const PLACEHOLDER_PASSWORDS = new Set([
  '',
  'your_email_password',
  'password',
  'changeme',
]);

/**
 * True when EMAIL_* look like real SMTP credentials (not .env.example placeholders).
 */
export const isSmtpConfigured = () => {
  const host = String(env.email.host || '')
    .trim()
    .toLowerCase();
  const user = String(env.email.user || '')
    .trim()
    .toLowerCase();
  const pass = String(env.email.pass || '').trim();

  if (!host || !user || !pass) return false;
  if (PLACEHOLDER_HOSTS.has(host)) return false;
  if (PLACEHOLDER_USERS.has(user)) return false;
  if (PLACEHOLDER_PASSWORDS.has(pass)) return false;
  return true;
};

export const getEmailDeliveryMode = () =>
  isSmtpConfigured() ? 'smtp' : 'not_configured';

const buildTransporter = () => {
  const port = Number(env.email.port) || 587;
  const secure =
    typeof env.email.secure === 'boolean'
      ? env.email.secure
      : port === 465;

  return nodemailer.createTransport({
    host: env.email.host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
};

const getTransporter = () => {
  if (!isSmtpConfigured()) {
    return null;
  }

  const key = `${env.email.host}|${env.email.port}|${env.email.user}`;
  if (transporter && transporterKey === key) {
    return transporter;
  }

  transporter = buildTransporter();
  transporterKey = key;
  return transporter;
};

/**
 * Sends an email via SMTP when configured.
 * Never logs message bodies that may contain verification/reset tokens.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const mail = {
    from: env.email.from,
    to,
    subject,
    html,
    text,
  };

  if (!isSmtpConfigured()) {
    console.warn(
      '[email] SMTP is not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM in server/.env (use a Gmail App Password for Gmail). Message was NOT delivered.',
      { to, subject },
    );
    return {
      accepted: [],
      mocked: true,
      delivered: false,
      mode: 'not_configured',
    };
  }

  const transport = getTransporter();

  try {
    const info = await transport.sendMail(mail);
    console.info('[email] Message accepted by SMTP', {
      to,
      subject,
      messageId: info.messageId,
    });
    return {
      ...info,
      mocked: false,
      delivered: true,
      mode: 'smtp',
    };
  } catch (error) {
    // Do not include auth credentials or message body in logs.
    console.error('[email] SMTP send failed:', {
      to,
      subject,
      code: error.code,
      responseCode: error.responseCode,
      message: error.message,
    });
    const err = new Error(
      'Failed to send email via SMTP. Check EMAIL_* settings (for Gmail, use an App Password).',
    );
    err.cause = error;
    err.code = 'EMAIL_SEND_FAILED';
    throw err;
  }
};

export const sendVerificationEmail = async ({ to, name, token }) => {
  const base = String(env.clientUrl || '')
    .trim()
    .replace(/\/+$/, '');
  const verifyUrl = `${base}/verify-email?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to,
    subject: 'Verify your SliceHub account',
    text: `Hi ${name}, verify your email: ${verifyUrl}`,
    html: `
      <p>Hi ${name},</p>
      <p>Welcome to SliceHub. Please verify your email address:</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
      <p>Or open this link: ${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
      <p style="color:#666;font-size:12px;">Local development: open this link on the same computer that is running the SliceHub frontend (http://localhost:5173). Opening it on a phone will not work while using localhost.</p>
    `,
  });
};

export const sendPasswordResetEmail = async ({
  to,
  name,
  token,
  isAdmin = false,
}) => {
  const path = isAdmin ? '/admin/reset-password' : '/reset-password';
  const resetUrl = `${env.clientUrl}${path}?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to,
    subject: 'Reset your SliceHub password',
    text: `Hi ${name}, reset your password: ${resetUrl}`,
    html: `
      <p>Hi ${name},</p>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>Or open this link: ${resetUrl}</p>
      <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
    `,
  });
};

export const sendOrderStatusEmail = async ({
  to,
  name,
  orderNumber,
  status,
  orderUrl,
}) => {
  const subjectMap = {
    pending: `Order ${orderNumber} placed`,
    confirmed: `Order ${orderNumber} confirmed`,
    delivered: `Order ${orderNumber} delivered`,
    cancelled: `Order ${orderNumber} cancelled`,
  };
  const subject = subjectMap[status] || `Order ${orderNumber} update`;
  return sendEmail({
    to,
    subject: `[SliceHub] ${subject}`,
    text: `Hi ${name}, your order ${orderNumber} is now "${status}". View: ${orderUrl}`,
    html: `
      <p>Hi ${name},</p>
      <p>Your SliceHub order <strong>${orderNumber}</strong> status is now <strong>${status.replace(/_/g, ' ')}</strong>.</p>
      <p><a href="${orderUrl}">View order</a></p>
    `,
  });
};

export const sendPaymentStatusEmail = async ({
  to,
  name,
  orderNumber,
  success,
  orderUrl,
}) => {
  const subject = success
    ? `Payment successful for ${orderNumber}`
    : `Payment failed for ${orderNumber}`;
  return sendEmail({
    to,
    subject: `[SliceHub] ${subject}`,
    text: success
      ? `Hi ${name}, payment for order ${orderNumber} succeeded. ${orderUrl}`
      : `Hi ${name}, payment for order ${orderNumber} failed. ${orderUrl}`,
    html: `
      <p>Hi ${name},</p>
      <p>${
        success
          ? `Payment for order <strong>${orderNumber}</strong> was successful.`
          : `Payment for order <strong>${orderNumber}</strong> failed. You can retry from your order page.`
      }</p>
      <p><a href="${orderUrl}">View order</a></p>
    `,
  });
};

export const sendReviewSubmittedEmail = async ({ to, name, pizzaName }) => {
  return sendEmail({
    to,
    subject: '[SliceHub] Thanks for your review',
    text: `Hi ${name}, thanks for reviewing ${pizzaName}.`,
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for reviewing <strong>${pizzaName}</strong>. Your feedback helps other pizza lovers.</p>
    `,
  });
};
