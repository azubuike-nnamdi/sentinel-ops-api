import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
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

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 5,
    description: 'Max candidate root causes to return',
  })
  @IsOptional()
  @IsNumber()
  topK?: number;
}
