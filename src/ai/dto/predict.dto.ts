import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
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

export class PredictDto {
  @ApiProperty({ example: '665f1c2e8f1a2b3c4d5e6f70' })
  @IsMongoId()
  serviceId!: string;

  @ApiProperty({
    example: 'Checkout latency increased and error rate spiked',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  symptom!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  signals?: string[];

  @ApiPropertyOptional({
    type: Object,
    example: {
      dependencies: [
        {
          dependency_id: 'inventory-service',
          dependency_name: 'Inventory Service',
          error_rate: 0.12,
          latency_ms: 900,
          health_status: 'unhealthy',
          traffic_share: 0.8,
        },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 5,
    description: 'Max candidate root causes to return',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiPropertyOptional({
    description:
      'When true, include feature vector and AI payload in the response (no secrets)',
  })
  @IsOptional()
  @IsBoolean()
  debug?: boolean;
}
