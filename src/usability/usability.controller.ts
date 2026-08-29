import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../common/decorators';
import { ALL_ROLES, UserRole } from '../common/enums';
import { RecordUsabilityEventDto } from './dto/record-usability-event.dto';
import { SubmitSusDto } from './dto/submit-sus.dto';
import { UsabilityQueryDto } from './dto/usability-query.dto';
import { UsabilityService } from './usability.service';

@ApiTags('Usability')
@ApiBearerAuth('JWT')
@Controller('usability')
export class UsabilityController {
  constructor(private readonly usabilityService: UsabilityService) {}

  @Post('events')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Record a privacy-safe usability event' })
  async recordEvent(
    @CurrentUser('id') actorId: string,
    @Body() dto: RecordUsabilityEventDto,
  ) {
    const data = await this.usabilityService.recordEvent(actorId, dto);
    return { message: 'Usability event recorded successfully', data };
  }

  @Post('surveys/sus')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Submit a consented SUS response' })
  async submitSus(
    @CurrentUser('id') actorId: string,
    @Body() dto: SubmitSusDto,
  ) {
    const data = await this.usabilityService.submitSus(actorId, dto);
    return { message: 'Usability survey submitted successfully', data };
  }

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVOPS)
  @ApiOperation({ summary: 'Get aggregate usability measurements' })
  async summary(@Query() query: UsabilityQueryDto) {
    const data = await this.usabilityService.getSummary(query);
    return { message: 'Usability summary retrieved successfully', data };
  }

  @Delete('events/me')
  @Roles(...ALL_ROLES)
  @ApiOperation({ summary: 'Delete the current actor usability data' })
  async purge(@CurrentUser('id') actorId: string) {
    const data = await this.usabilityService.purgeActor(actorId);
    return { message: 'Usability data deleted successfully', data };
  }
}
