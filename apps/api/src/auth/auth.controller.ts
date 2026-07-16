import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ResendVerificationDto, VerifyEmailDto } from './auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() input: RegisterDto) {
    return this.auth.register(input);
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyEmail(@Body() input: VerifyEmailDto) {
    return this.auth.verifyEmail(input.token);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async login(@Body() input: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(input);
    response.cookie(this.cookieName(), result.secret, this.cookieOptions());
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.[this.cookieName()] as string | undefined);
    response.clearCookie(this.cookieName(), this.cookieOptions());
    return { message: '已退出登录' };
  }

  @Get('me')
  me(@Req() request: Request) {
    return this.auth.authenticate(request.cookies?.[this.cookieName()] as string | undefined);
  }

  @Post('resend-verification')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  resend(@Body() input: ResendVerificationDto) {
    return this.auth.resendVerification(input.email);
  }

  private cookieName(): string {
    return this.config.getOrThrow<string>('AUTH_COOKIE_NAME');
  }

  private cookieOptions() {
    const production = this.config.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: production,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: this.config.getOrThrow<number>('SESSION_TTL_HOURS') * 3_600_000,
    };
  }
}
