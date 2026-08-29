import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';
import {
  USABILITY_EVENT_NAMES,
  USABILITY_TASK_IDS,
  UsabilityEventProperties,
} from '../interfaces/usability.interface';

export class RecordUsabilityEventDto {
  @ApiProperty({ enum: USABILITY_EVENT_NAMES })
  @IsEnum(USABILITY_EVENT_NAMES)
  eventName!: (typeof USABILITY_EVENT_NAMES)[number];

  @ApiPropertyOptional({ enum: USABILITY_TASK_IDS })
  @IsOptional()
  @IsEnum(USABILITY_TASK_IDS)
  taskId?: (typeof USABILITY_TASK_IDS)[number];

  @ApiProperty({ example: 'study-session-01' })
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_-]+$/)
  sessionId!: string;

  @ApiProperty({ example: 'predictions' })
  @IsString()
  @MaxLength(100)
  @Matches(/^[A-Za-z0-9/_-]+$/)
  routeKey!: string;

  @ApiPropertyOptional({ example: '2026-08-29T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional({ example: 3400, minimum: 0, maximum: 3600000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(3_600_000)
  durationMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @ApiPropertyOptional({ example: 'validation' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_-]+$/)
  errorCategory?: string;

  @ApiPropertyOptional({
    type: Object,
    example: { metric: 'LCP', value: 1200 },
  })
  @IsOptional()
  @IsObject()
  properties?: UsabilityEventProperties;
}
