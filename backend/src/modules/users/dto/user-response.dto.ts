import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { UserRole, UserSegment } from '../../../common/enums';

export class DepartmentDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  code: string;
}

@Exclude()
export class UserResponseDto {
  @ApiProperty({ description: 'User UUID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User email address' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'User full name' })
  @Expose()
  fullName: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  @Expose()
  phone: string | null;

  @ApiProperty({ enum: UserRole, description: 'User role' })
  @Expose()
  role: UserRole;

  @ApiPropertyOptional({ enum: UserSegment, description: 'User segment' })
  @Expose()
  userSegment: UserSegment | null;

  @ApiPropertyOptional({ description: 'Department UUID' })
  @Expose()
  departmentId: string | null;

  @ApiPropertyOptional({ description: 'Department details', type: DepartmentDto })
  @Expose()
  @Type(() => DepartmentDto)
  department: DepartmentDto | null;

  @ApiProperty({ description: 'Whether user is active' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  // passwordHash excluded by @Exclude() class decorator
}
