export const MAIL_SERVICE = Symbol('MAIL_SERVICE');

export interface VerificationMail {
  to: string;
  displayName: string;
  verificationUrl: string;
  expiresInMinutes: number;
}

export interface MailDeliveryResult {
  developmentPreviewUrl?: string;
}

export interface MailService {
  sendVerification(mail: VerificationMail): Promise<MailDeliveryResult>;
}

export function renderVerificationEmail(mail: VerificationMail): { html: string; text: string } {
  const safeName = escapeHtml(mail.displayName);
  const safeUrl = escapeHtml(mail.verificationUrl);
  const expiry = `${mail.expiresInMinutes} 分钟`;

  return {
    html: `<main><h1>Liftoff 起飞社区</h1><p>${safeName}，欢迎加入 Liftoff。</p><p><a href="${safeUrl}">验证邮箱</a></p><p>链接将在 ${expiry}后失效。如果这不是你的操作，请忽略此邮件。</p></main>`,
    text: `Liftoff 起飞社区\n\n${mail.displayName}，欢迎加入 Liftoff。\n\n验证邮箱：${mail.verificationUrl}\n\n链接将在 ${expiry}后失效。如果这不是你的操作，请忽略此邮件。`,
  };
}

export const VERIFICATION_EMAIL_SUBJECT = '验证你的 Liftoff 邮箱';

export function buildVerificationUrl(baseUrl: string, token: string): string {
  const url = new URL('/verify-email', baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}
