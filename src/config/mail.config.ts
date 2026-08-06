import { registerAs } from '@nestjs/config';

function isTruthy(value: string | undefined): boolean {
  return ['true', '1', 'yes'].includes((value ?? '').trim().toLowerCase());
}

export default registerAs('mail', () => ({
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '25', 10),
  from: process.env.SMTP_FROM || 'no-reply@sentinel.com',
  senderName: process.env.SMTP_SENDER_NAME || 'Sentinel Ops',
  user: process.env.SMTP_USER || '',
  password: process.env.SMTP_PASSWORD || '',
  insecureTls: isTruthy(process.env.SMTP_INSECURE_TLS ?? 'true'),
  // null | false | none → no SMTP auth (common for internal relays on port 25)
  authMode: (process.env.MAIL_AUTH || 'null').trim().toLowerCase(),
  frontendUrl:
    process.env.FRONTEND_URL ||
    process.env.ADMIN_FRONTEND_URL ||
    'http://localhost:3000',
  inviteTtlDays: parseInt(process.env.INVITE_TTL_DAYS || '7', 10),
}));
