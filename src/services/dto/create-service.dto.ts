import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ServiceStatus } from '../../common/enums';

export class CreateServiceDto {
  @ApiProperty({ example: 'Payment Gateway' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'payment-gateway' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(120)
  slug!: string;

  @ApiPropertyOptional({ example: 'Handles payment processing' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 'payments-team' })
  @IsString()
  @IsNotEmpty()
  owner!: string;

  @ApiProperty({ example: 'production' })
  @IsString()
  @IsNotEmpty()
  environment!: string;

  @ApiPropertyOptional({ enum: ServiceStatus, default: ServiceStatus.UNKNOWN })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @ApiPropertyOptional({ type: [String], example: ['https://pay.example.com'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  endpoints?: string[];

  @ApiPropertyOptional({ type: [String], example: ['payments', 'critical'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
