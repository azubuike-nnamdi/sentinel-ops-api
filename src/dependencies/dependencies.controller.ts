import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums';
import { DependenciesService } from './dependencies.service';

@ApiTags('Dependencies')
@ApiBearerAuth('JWT')
@Controller('dependencies')
export class DependenciesController {
  constructor(private readonly dependenciesService: DependenciesService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVOPS, UserRole.OPS)
  @ApiOperation({ summary: 'List service dependency relationships' })
  async findAll(@Query() query: PaginationQueryDto) {
    const data = await this.dependenciesService.findAll(query);
    return { message: 'Dependencies retrieved successfully', data };
  }
}
