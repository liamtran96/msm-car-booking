import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleChangeDto {
  @ApiProperty({
    description: 'New scheduled time (HH:MM format)',
    example: '14:30',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:MM format (00:00 - 23:59)',
  })
  newTime: string;

  @ApiPropertyOptional({
    description: 'Reason for the schedule change',
    example: 'Meeting extended by 30 minutes',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Original scheduled time for reference',
    example: '14:00',
  })
  @IsOptional()
  @IsString()
  originalTime?: string;
}
