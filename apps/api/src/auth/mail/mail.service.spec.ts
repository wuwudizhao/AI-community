import { buildVerificationUrl, renderVerificationEmail } from './mail.service';

describe('verification email template', () => {
  it('contains the brand, action, URL, expiry and unsolicited-mail notice', () => {
    const result = renderVerificationEmail({
      to: 'builder@example.test',
      displayName: 'Builder',
      verificationUrl: 'http://localhost:3000/verify-email?token=redacted',
      expiresInMinutes: 30,
    });

    expect(result.html).toContain('Liftoff 起飞社区');
    expect(result.html).toContain('验证邮箱');
    expect(result.text).toContain('token=redacted');
    expect(result.text).toContain('30 分钟');
    expect(result.text).toContain('如果这不是你的操作');
  });

  it('builds the verification URL from the configured Web base URL', () => {
    const url = buildVerificationUrl('https://community.example/base', 'a token');
    expect(url).toBe('https://community.example/verify-email?token=a+token');
  });
});
