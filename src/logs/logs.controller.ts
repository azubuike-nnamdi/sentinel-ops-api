import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums';
import { CreateLogDto } from './dto/create-log.dto';
import { LogsService } from './logs.service';

@ApiTags('Logs')
@ApiBearerAuth('JWT')
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVOPS, UserRole.OPS)
  @ApiOperation({ summary: 'Ingest an application log entry' })
  async create(@Body() dto: CreateLogDto) {
    const data = await this.logsService.create(dto);
    return { message: 'Log created successfully', data };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVOPS, UserRole.OPS)
  @ApiOperation({ summary: 'List application logs' })
  async findAll(@Query() query: PaginationQueryDto) {
    const data = await this.logsService.findAll(query);
    return { message: 'Logs retrieved successfully', data };
  }
}
