import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums';
import { CreateMetricDto } from './dto/create-metric.dto';
import { MetricsService } from './metrics.service';

@ApiTags('Metrics')
@ApiBearerAuth('JWT')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.DEVOPS_ENGINEER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Ingest a service metric datapoint' })
  async create(@Body() dto: CreateMetricDto) {
    const data = await this.metricsService.create(dto);
    return { message: 'Metric created successfully', data };
  }

  @Get()
  @Roles(UserRole.ADMINISTRATOR, UserRole.DEVOPS_ENGINEER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'List service metrics' })
  async findAll(@Query() query: PaginationQueryDto) {
    const data = await this.metricsService.findAll(query);
    return { message: 'Metrics retrieved successfully', data };
  }
}
