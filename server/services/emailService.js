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
