import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DevelopmentMailService } from './mail/development-mail.service';
import { MAIL_SERVICE } from './mail/mail.service';
import { ProductionMailService } from './mail/production-mail.service';
import { SessionAuthGuard } from './session-auth.guard';
import { OptionalSessionAuthGuard } from './optional-session-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    DevelopmentMailService,
    ProductionMailService,
    SessionAuthGuard,
    OptionalSessionAuthGuard,
    {
      provide: MAIL_SERVICE,
      inject: [ConfigService, DevelopmentMailService, ProductionMailService],
      useFactory: (
        config: ConfigService,
        development: DevelopmentMailService,
        production: ProductionMailService,
      ) => (config.get<string>('NODE_ENV') === 'production' ? production : development),
    },
  ],
  exports: [AuthService, SessionAuthGuard, OptionalSessionAuthGuard],
})
export class AuthModule {}
