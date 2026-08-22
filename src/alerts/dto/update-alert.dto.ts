import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AlertStatus } from '../../common/enums';

export class UpdateAlertDto {
  @ApiProperty({
    enum: [AlertStatus.ACKNOWLEDGED, AlertStatus.RESOLVED, AlertStatus.SUPPRESSED],
  })
  @IsEnum(AlertStatus)
  status!: AlertStatus.ACKNOWLEDGED | AlertStatus.RESOLVED | AlertStatus.SUPPRESSED;
}
