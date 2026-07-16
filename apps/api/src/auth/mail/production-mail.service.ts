import { createHash } from 'node:crypto';
import { HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  renderVerificationEmail,
  VERIFICATION_EMAIL_SUBJECT,
  type MailDeliveryResult,
  type MailService,
  type VerificationMail,
} from './mail.service';

@Injectable()
export class ProductionMailService implements MailService {
  constructor(private readonly config: ConfigService) {}

  async sendVerification(mail: VerificationMail): Promise<MailDeliveryResult> {
    if (this.config.getOrThrow<string>('MAIL_PROVIDER') !== 'resend') {
      throw new ServiceUnavailableException('邮件提供商配置无效');
    }
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.getOrThrow<number>('MAIL_TIMEOUT_MS'),
    );
    const content = renderVerificationEmail(mail);
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.config.getOrThrow<string>('MAIL_API_KEY')}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': verificationIdempotencyKey(mail.verificationUrl),
        },
        body: JSON.stringify({
          from: `${this.config.getOrThrow<string>('MAIL_FROM_NAME')} <${this.config.getOrThrow<string>('MAIL_FROM_ADDRESS')}>`,
          to: [mail.to],
          subject: VERIFICATION_EMAIL_SUBJECT,
          html: content.html,
          text: content.text,
        }),
      });
      if (!response.ok) throw providerError(response);
      return {};
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException(
        error instanceof Error && error.name === 'AbortError'
          ? '邮件服务响应超时，请稍后重试'
          : '邮件服务暂时不可用，请稍后重试',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function verificationIdempotencyKey(url: string): string {
  return `verify-email/${createHash('sha256').update(url).digest('hex')}`;
}

function providerError(response: Response): HttpException {
  if (response.status === 429) return new HttpException('邮件发送过于频繁，请稍后重试', 429);
  if (response.status >= 500)
    return new ServiceUnavailableException('邮件服务暂时不可用，请稍后重试');
  const rejected = response.status === 422 || response.status === 403;
  return new HttpException(
    rejected ? '邮件未被服务商接受，请检查邮箱地址或联系支持' : '邮件发送配置错误',
    rejected ? 422 : 502,
  );
}
