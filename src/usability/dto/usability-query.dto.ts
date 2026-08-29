import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';
import { USABILITY_TASK_IDS } from '../interfaces/usability.interface';

export class UsabilityQueryDto {
  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-08-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ enum: USABILITY_TASK_IDS })
  @IsOptional()
  @IsIn(USABILITY_TASK_IDS)
  taskId?: (typeof USABILITY_TASK_IDS)[number];
}
