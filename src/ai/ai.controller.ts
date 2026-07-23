import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { UserRole } from '../common/enums';
import { PredictDto } from './dto/predict.dto';
import { AiService } from './ai.service';

@ApiTags('AI')
@ApiBearerAuth('JWT')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('predict')
  @Roles(UserRole.ADMINISTRATOR, UserRole.DEVOPS_ENGINEER, UserRole.OPERATOR)
  @ApiOperation({
    summary: 'Run AI-assisted root cause prediction for a service symptom',
  })
  async predict(@Body() dto: PredictDto) {
    const data = await this.aiService.predict(dto);
    return { message: 'Prediction generated successfully', data };
  }
}
