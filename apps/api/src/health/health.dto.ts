import type { HealthResponse } from '@liftoff/shared-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DatabaseHealthDto {
  @ApiProperty({ enum: ['up', 'down'] })
  status!: 'up' | 'down';

  @ApiProperty({ nullable: true, example: 4 })
  latencyMs!: number | null;

  @ApiPropertyOptional()
  message?: string;
}

export class HealthResponseDto implements HealthResponse {
  @ApiProperty({ enum: ['ok', 'degraded'] })
  status!: 'ok' | 'degraded';

  @ApiProperty({ enum: ['liftoff-api'] })
  service!: 'liftoff-api';

  @ApiProperty({ format: 'date-time' })
  timestamp!: string;

  @ApiProperty()
  uptimeSeconds!: number;

  @ApiProperty({ type: DatabaseHealthDto })
  database!: DatabaseHealthDto;
}
