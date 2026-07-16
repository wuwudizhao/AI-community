import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

const WINDOW_MS = 10 * 60_000;
const MAX_POSTS_PER_WINDOW = 5;
const MAX_POSTS_PER_IP_WINDOW = 25;

@Injectable()
export class PostSubmissionProtectionService {
  private readonly attempts = new Map<string, number[]>();

  consume(identityKey: string | undefined, ip: string, now = Date.now()): void {
    const primaryKey = identityKey ?? `ip:${ip}`;
    this.assertAvailable(primaryKey, MAX_POSTS_PER_WINDOW, now);
    if (identityKey) this.assertAvailable(`ip:${ip}`, MAX_POSTS_PER_IP_WINDOW, now);
    this.record(primaryKey, now);
    if (identityKey) this.record(`ip:${ip}`, now);
  }

  private assertAvailable(key: string, limit: number, now: number): void {
    if (this.recent(key, now).length >= limit) {
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private record(key: string, now: number): void {
    this.attempts.set(key, [...this.recent(key, now), now]);
  }

  private recent(key: string, now: number): number[] {
    return (this.attempts.get(key) ?? []).filter((time) => time > now - WINDOW_MS);
  }
}
