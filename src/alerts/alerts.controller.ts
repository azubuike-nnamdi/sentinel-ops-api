import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums';
import { AlertsService } from './alerts.service';

@ApiTags('Alerts')
@ApiBearerAuth('JWT')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVOPS, UserRole.OPS)
  @ApiOperation({ summary: 'List alerts' })
  async findAll(@Query() query: PaginationQueryDto) {
    const data = await this.alertsService.findAll(query);
    return { message: 'Alerts retrieved successfully', data };
  }
}
