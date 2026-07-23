import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = unknown> {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message!: string;

  @ApiPropertyOptional()
  data!: T | null;

  @ApiProperty({ example: '2026-07-23T15:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  requestId!: string;
}
