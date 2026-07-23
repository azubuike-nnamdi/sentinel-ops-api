import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './decorators';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  check() {
    return {
      message: 'SentinelOps API is healthy',
      data: {
        status: 'ok',
        service: 'sentinelops-api',
        uptime: process.uptime(),
      },
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  ready() {
    return {
      message: 'SentinelOps API is ready',
      data: {
        status: 'ready',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
