import {
  IsString,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateMessageDto {
  @ApiProperty({ description: 'Message content (1-5000 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Message cannot be empty' })
  @MaxLength(5000, { message: 'Message cannot exceed 5000 characters' })
  @Transform(({ value }: { value: string }) => value?.trim())
  content: string;

  @ApiPropertyOptional({
    description: 'Message type (text, schedule_change, system)',
    default: 'text',
  })
  @IsOptional()
  @IsString()
  messageType?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata (for schedule changes)',
    example: { newTime: '14:30', reason: 'Meeting extended' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
