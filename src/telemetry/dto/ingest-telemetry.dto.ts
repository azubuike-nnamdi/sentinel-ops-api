import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { LogLevel } from '../../common/enums';
import { MetricType } from '../../metrics/schemas/metric.schema';

class TelemetryLogDto {
  @ApiProperty()
  @IsMongoId()
  serviceId!: string;

  @ApiProperty({ enum: LogLevel })
  @IsEnum(LogLevel)
  level!: LogLevel;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  traceId?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

class TelemetryMetricDto {
  @ApiProperty()
  @IsMongoId()
  serviceId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsNumber()
  value!: number;

  @ApiPropertyOptional({ enum: MetricType })
  @IsOptional()
  @IsEnum(MetricType)
  type?: MetricType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  labels?: Record<string, string>;
}

export class IngestTelemetryDto {
  @ApiPropertyOptional({ type: [TelemetryLogDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TelemetryLogDto)
  logs?: TelemetryLogDto[];

  @ApiPropertyOptional({ type: [TelemetryMetricDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TelemetryMetricDto)
  metrics?: TelemetryMetricDto[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  source?: Record<string, unknown>;
}
