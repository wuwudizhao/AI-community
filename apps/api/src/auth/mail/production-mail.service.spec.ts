import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductionMailService, verificationIdempotencyKey } from './production-mail.service';

describe('ProductionMailService', () => {
  const values: Record<string, string | number> = {
    MAIL_PROVIDER: 'resend',
    MAIL_API_KEY: 'test-key-not-real',
    MAIL_FROM_ADDRESS: 'mail@example.test',
    MAIL_FROM_NAME: 'Liftoff',
    MAIL_TIMEOUT_MS: 1000,
  };
  const config = { getOrThrow: (key: string) => values[key] } as ConfigService;
  const mail = {
    to: 'user@example.test',
    displayName: 'Builder',
    verificationUrl: 'https://liftoff.example/verify-email?token=secret',
    expiresInMinutes: 60,
  };
  let service: ProductionMailService;

  beforeEach(() => {
    service = new ProductionMailService(config);
    jest.restoreAllMocks();
  });

  it('sends HTML and text through Resend with an opaque idempotency key', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 'email-id' }), { status: 200 }));
    await expect(service.sendVerification(mail)).resolves.toEqual({});
    const [, request] = fetchMock.mock.calls[0];
    expect(request?.headers).toMatchObject({ Authorization: 'Bearer test-key-not-real' });
    expect(JSON.parse(request?.body as string)).toMatchObject({
      from: 'Liftoff <mail@example.test>',
      to: ['user@example.test'],
    });
    expect(String((request?.headers as Record<string, string>)['Idempotency-Key'])).not.toContain(
      'secret',
    );
  });

  it.each([
    [429, 429],
    [422, 422],
    [500, 503],
  ])('maps provider status %s to %s', async (providerStatus, expected) => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ message: 'provider details' }), { status: providerStatus }),
      );
    await expect(service.sendVerification(mail)).rejects.toMatchObject({ status: expected });
  });

  it('fails clearly when the provider is unavailable', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
    await expect(service.sendVerification(mail)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('does not expose the verification token in its idempotency key', () => {
    expect(verificationIdempotencyKey(mail.verificationUrl)).toMatch(
      /^verify-email\/[a-f0-9]{64}$/,
    );
  });
});
