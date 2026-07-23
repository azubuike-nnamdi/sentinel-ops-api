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
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AnomalyStatus } from '../../common/enums';

export class CreateAnomalyDto {
  @ApiProperty({ example: '665f1c2e8f1a2b3c4d5e6f70' })
  @IsMongoId()
  serviceId!: string;

  @ApiProperty({ example: 'http_request_latency_ms' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  metricName!: string;

  @ApiProperty({ example: 0.92, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  score!: number;

  @ApiPropertyOptional({ enum: AnomalyStatus, default: AnomalyStatus.DETECTED })
  @IsOptional()
  @IsEnum(AnomalyStatus)
  status?: AnomalyStatus;

  @ApiProperty({ example: 'Latency spike above 3σ baseline' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @ApiPropertyOptional({ example: '2026-07-23T15:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  detectedAt?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  evidence?: Record<string, unknown>;
}
