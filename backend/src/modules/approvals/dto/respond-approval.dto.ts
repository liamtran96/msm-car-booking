import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalStatus } from '../../../common/enums';

export class RespondApprovalDto {
  @ApiProperty({
    enum: [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED],
    description: 'Approval decision',
  })
  @IsEnum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED])
  decision: ApprovalStatus.APPROVED | ApprovalStatus.REJECTED;

  @ApiPropertyOptional({ description: 'Notes for the approval/rejection' })
  @IsOptional()
  @IsString()
  notes?: string;
}
