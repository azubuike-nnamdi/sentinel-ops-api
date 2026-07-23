import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LogLevel } from '../../common/enums';

export class CreateLogDto {
  @ApiProperty({ example: '665f1c2e8f1a2b3c4d5e6f70' })
  @IsMongoId()
  serviceId!: string;

  @ApiProperty({ enum: LogLevel, example: LogLevel.ERROR })
  @IsEnum(LogLevel)
  level!: LogLevel;

  @ApiProperty({ example: 'Payment callback failed with timeout' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message!: string;

  @ApiPropertyOptional({ example: '2026-07-23T15:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  traceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  spanId?: string;

  @ApiPropertyOptional({ example: 'application' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  host?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
