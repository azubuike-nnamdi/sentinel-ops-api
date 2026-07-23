import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { UserRole } from '../common/enums';
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto';
import { TelemetryService } from './telemetry.service';

@ApiTags('Telemetry')
@ApiBearerAuth('JWT')
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post()
  @Roles(UserRole.ADMINISTRATOR, UserRole.DEVOPS_ENGINEER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Batch ingest logs and metrics telemetry' })
  async ingest(@Body() dto: IngestTelemetryDto) {
    const data = await this.telemetryService.ingest(dto);
    return { message: 'Telemetry ingested successfully', data };
  }
}
