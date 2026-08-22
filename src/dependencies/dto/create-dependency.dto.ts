import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { DependencyType } from '../../common/enums';

export class CreateDependencyDto {
  @ApiProperty()
  @IsMongoId()
  sourceServiceId!: string;

  @ApiProperty()
  @IsMongoId()
  targetServiceId!: string;

  @ApiProperty({ enum: DependencyType })
  @IsEnum(DependencyType)
  type!: DependencyType;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'critical'] })
  @IsOptional()
  @IsString()
  criticality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
