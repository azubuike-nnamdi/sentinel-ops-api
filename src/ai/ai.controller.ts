import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../common/decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces';
import { PredictDto } from './dto/predict.dto';
import { AiService } from './ai.service';

@ApiTags('AI')
@ApiBearerAuth('JWT')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('predict')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVOPS, UserRole.OPS)
  @ApiOperation({
    summary: 'Run AI-assisted root cause prediction for a service symptom',
  })
  async predict(
    @Body() dto: PredictDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.aiService.predict(dto, user.id);
    return { message: 'Prediction generated successfully', data };
  }

  @Get('predictions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVOPS, UserRole.OPS)
  @ApiOperation({ summary: 'List saved prediction runs for the current user' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.aiService.findAll(query, user.id);
    return { message: 'Predictions retrieved successfully', data };
  }

  @Get('predictions/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DEVOPS, UserRole.OPS)
  @ApiOperation({ summary: 'Get a saved prediction by id' })
  async findOne(@Param('id') id: string) {
    const data = await this.aiService.findById(id);
    return { message: 'Prediction retrieved successfully', data };
  }
}
