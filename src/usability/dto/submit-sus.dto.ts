import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';

export class SubmitSusDto {
  @ApiProperty({ example: 'study-session-01' })
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_-]+$/)
  studySessionId!: string;

  @ApiProperty({
    type: [Number],
    example: [4, 2, 4, 1, 5, 2, 4, 2, 5, 1],
    description: 'The ten standard SUS responses, each scored from 1 to 5',
  })
  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(5, { each: true })
  answers!: number[];

  @ApiProperty({
    description: 'Explicit consent to store this research response',
  })
  @IsBoolean()
  consent!: boolean;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}
