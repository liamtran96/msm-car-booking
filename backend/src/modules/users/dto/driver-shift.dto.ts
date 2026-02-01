import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { ShiftStatus } from '../../../common/enums';
import { UserResponseDto } from './user-response.dto';

export class CreateDriverShiftDto {
  @ApiProperty({ description: 'Driver user ID' })
  @IsUUID()
  @IsNotEmpty()
  driverId: string;

  @ApiProperty({
    description: 'Shift date (YYYY-MM-DD)',
    example: '2026-02-01',
  })
  @IsDateString()
  @IsNotEmpty()
  shiftDate: string;

  @ApiProperty({ description: 'Start time (HH:mm)', example: '08:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in HH:mm format',
  })
  startTime: string;

  @ApiProperty({ description: 'End time (HH:mm)', example: '17:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'End time must be in HH:mm format',
  })
  endTime: string;
}

export class UpdateDriverShiftDto extends PartialType(CreateDriverShiftDto) {
  @ApiPropertyOptional({ enum: ShiftStatus, description: 'Shift status' })
  @IsEnum(ShiftStatus)
  @IsOptional()
  status?: ShiftStatus;
}

export class DriverShiftFilterDto {
  @ApiPropertyOptional({ description: 'Filter by driver ID' })
  @IsUUID()
  @IsOptional()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Filter by date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'Filter by date from (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date to (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ enum: ShiftStatus, description: 'Filter by status' })
  @IsEnum(ShiftStatus)
  @IsOptional()
  status?: ShiftStatus;
}

export class DriverShiftResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  driverId: string;

  @ApiProperty()
  shiftDate: Date;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty({ enum: ShiftStatus })
  status: ShiftStatus;

  @ApiPropertyOptional()
  actualStart: Date | null;

  @ApiPropertyOptional()
  actualEnd: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => UserResponseDto })
  driver?: UserResponseDto;
}
