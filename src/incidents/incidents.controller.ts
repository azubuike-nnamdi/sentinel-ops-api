import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
} from './dto/incident.dto';
import { IncidentsService } from './incidents.service';

@ApiTags('Incidents')
@ApiBearerAuth('JWT')
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) { }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVOPS)
  @ApiOperation({ summary: 'Create an incident' })
  async create(@Body() dto: CreateIncidentDto) {
    const data = await this.incidentsService.create(dto);
    return { message: 'Incident created successfully', data };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVOPS, UserRole.OPS)
  @ApiOperation({ summary: 'List incidents' })
  async findAll(@Query() query: PaginationQueryDto) {
    const data = await this.incidentsService.findAll(query);
    return { message: 'Incidents retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVOPS, UserRole.OPS)
  @ApiOperation({ summary: 'Update an incident by id' })
  async update(@Param('id') id: string, @Body() dto: UpdateIncidentDto) {
    const data = await this.incidentsService.update(id, dto);
    return { message: 'Incident updated successfully', data };
  }
}
