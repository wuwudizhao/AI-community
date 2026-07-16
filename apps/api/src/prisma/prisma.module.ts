import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';
import { DATABASE_HEALTH_PROBE } from './database-health-probe';

@Global()
@Module({
  providers: [PrismaService, { provide: DATABASE_HEALTH_PROBE, useExisting: PrismaService }],
  exports: [PrismaService, DATABASE_HEALTH_PROBE],
})
export class PrismaModule {}
