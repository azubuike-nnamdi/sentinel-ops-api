import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { UserRole, WRITE_ROLES } from '../common/enums';
import { CreateDependencyDto } from './dto/create-dependency.dto';
import { DependenciesService } from './dependencies.service';

@ApiTags('Dependencies')
@ApiBearerAuth('JWT')
@Controller('dependencies')
export class DependenciesController {
  constructor(private readonly dependenciesService: DependenciesService) {}

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Create a service dependency edge' })
  async create(@Body() dto: CreateDependencyDto) {
    const data = await this.dependenciesService.create(dto);
    return { message: 'Dependency created successfully', data };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVOPS, UserRole.OPS)
  @ApiOperation({ summary: 'List service dependency relationships' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('serviceId') serviceId?: string,
  ) {
    if (serviceId) {
      const items = await this.dependenciesService.findByServiceId(
        serviceId,
        query.limit,
      );
      return {
        message: 'Dependencies retrieved successfully',
        data: {
          items,
          meta: {
            total: items.length,
            page: 1,
            limit: query.limit,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      };
    }
    const data = await this.dependenciesService.findAll(query);
    return { message: 'Dependencies retrieved successfully', data };
  }
}
