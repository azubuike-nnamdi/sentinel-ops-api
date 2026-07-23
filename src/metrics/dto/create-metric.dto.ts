import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MetricType } from '../schemas/metric.schema';

export class CreateMetricDto {
  @ApiProperty({ example: '665f1c2e8f1a2b3c4d5e6f70' })
  @IsMongoId()
  serviceId!: string;

  @ApiProperty({ example: 'http_request_latency_ms' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ enum: MetricType, default: MetricType.GAUGE })
  @IsOptional()
  @IsEnum(MetricType)
  type?: MetricType;

  @ApiProperty({ example: 245.5 })
  @IsNumber()
  value!: number;

  @ApiPropertyOptional({ example: 'ms' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ type: Object, example: { route: '/checkout' } })
  @IsOptional()
  @IsObject()
  labels?: Record<string, string>;

  @ApiPropertyOptional({ example: '2026-07-23T15:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
