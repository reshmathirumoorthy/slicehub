import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter;

const hasSmtpConfig = () =>
  Boolean(env.email.host && env.email.user && env.email.pass);

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!hasSmtpConfig()) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
  });

  return transporter;
};

/**
 * Sends an email. In development without SMTP, logs the payload instead.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const mail = {
    from: env.email.from,
    to,
    subject,
    html,
    text,
  };

  const transport = getTransporter();

  if (!transport || env.email.host === 'smtp.example.com') {
    console.info('[email:dev-fallback]', {
      to,
      subject,
      text,
    });
    return { accepted: [to], mocked: true };
  }

  return transport.sendMail(mail);
};

export const sendVerificationEmail = async ({ to, name, token }) => {
  const verifyUrl = `${env.clientUrl}/verify-email?token=${token}`;

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
    `,
  });
};

export const sendPasswordResetEmail = async ({ to, name, token, isAdmin = false }) => {
  const path = isAdmin ? '/admin/reset-password' : '/reset-password';
  const resetUrl = `${env.clientUrl}${path}?token=${token}`;

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
