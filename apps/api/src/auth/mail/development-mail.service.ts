import { Injectable } from '@nestjs/common';

import {
  renderVerificationEmail,
  type MailDeliveryResult,
  type MailService,
  type VerificationMail,
} from './mail.service';

@Injectable()
export class DevelopmentMailService implements MailService {
  sendVerification(mail: VerificationMail): Promise<MailDeliveryResult> {
    renderVerificationEmail(mail);
    // Development-only controlled preview. The URL is returned to the registering client,
    // never written to application logs and never enabled in production.
    return Promise.resolve({ developmentPreviewUrl: mail.verificationUrl });
  }
}
