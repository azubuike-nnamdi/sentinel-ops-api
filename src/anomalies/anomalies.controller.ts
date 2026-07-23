import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums';
import { CreateAnomalyDto } from './dto/create-anomaly.dto';
import { AnomaliesService } from './anomalies.service';

@ApiTags('Anomalies')
@ApiBearerAuth('JWT')
@Controller('anomalies')
export class AnomaliesController {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.DEVOPS_ENGINEER)
  @ApiOperation({ summary: 'Record a detected anomaly' })
  async create(@Body() dto: CreateAnomalyDto) {
    const data = await this.anomaliesService.create(dto);
    return { message: 'Anomaly created successfully', data };
  }

  @Get()
  @Roles(UserRole.ADMINISTRATOR, UserRole.DEVOPS_ENGINEER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'List detected anomalies' })
  async findAll(@Query() query: PaginationQueryDto) {
    const data = await this.anomaliesService.findAll(query);
    return { message: 'Anomalies retrieved successfully', data };
  }
}
