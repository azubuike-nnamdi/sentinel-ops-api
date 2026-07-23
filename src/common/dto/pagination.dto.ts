import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { APP_CONSTANTS } from '../constants';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    minimum: 1,
    default: APP_CONSTANTS.DEFAULT_PAGE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = APP_CONSTANTS.DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: APP_CONSTANTS.MAX_LIMIT,
    default: APP_CONSTANTS.DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(APP_CONSTANTS.MAX_LIMIT)
  limit: number = APP_CONSTANTS.DEFAULT_LIMIT;

  @ApiPropertyOptional({ description: 'Free-text search query' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field (prefix with - for descending)',
    example: '-createdAt',
  })
  @IsOptional()
  @IsString()
  sort?: string;
}

export class PaginatedMetaDto {
  @ApiPropertyOptional({ example: 100 })
  total!: number;

  @ApiPropertyOptional({ example: 1 })
  page!: number;

  @ApiPropertyOptional({ example: 20 })
  limit!: number;

  @ApiPropertyOptional({ example: 5 })
  totalPages!: number;

  @ApiPropertyOptional({ example: true })
  hasNextPage!: boolean;

  @ApiPropertyOptional({ example: false })
  hasPreviousPage!: boolean;
}
