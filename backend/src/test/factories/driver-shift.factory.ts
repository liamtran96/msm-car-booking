import { DriverShift } from '../../modules/users/entities/driver-shift.entity';
import { ShiftStatus } from '../../common/enums';
import { generateUuid, today, formatTime } from '../utils/test-helper';
import { DriverShiftResponseDto } from '../../modules/users/dto/driver-shift.dto';
import { User } from '../../modules/users/entities/user.entity';

export interface CreateDriverShiftOptions {
  id?: string;
  driverId?: string;
  shiftDate?: Date;
  startTime?: string;
  endTime?: string;
  status?: ShiftStatus;
  actualStart?: Date;
  actualEnd?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a mock DriverShift entity
 */
export function createMockDriverShift(
  options: CreateDriverShiftOptions = {},
): DriverShift {
  const now = new Date();
  const todayDate = today();

  return {
    id: options.id ?? generateUuid(),
    driverId: options.driverId ?? generateUuid(),
    driver: undefined as unknown as User,
    shiftDate: options.shiftDate ?? todayDate,
    startTime: options.startTime ?? formatTime(8, 0),
    endTime: options.endTime ?? formatTime(17, 0),
    status: options.status ?? ShiftStatus.SCHEDULED,
    actualStart: options.actualStart ?? null!,
    actualEnd: options.actualEnd ?? null!,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Creates a scheduled shift
 */
export function createScheduledShift(
  options: CreateDriverShiftOptions = {},
): DriverShift {
  return createMockDriverShift({
    ...options,
    status: ShiftStatus.SCHEDULED,
  });
}

/**
 * Creates an active shift
 */
export function createActiveShift(
  options: CreateDriverShiftOptions = {},
): DriverShift {
  return createMockDriverShift({
    ...options,
    status: ShiftStatus.ACTIVE,
    actualStart: options.actualStart ?? new Date(),
  });
}

/**
 * Creates a completed shift
 */
export function createCompletedShift(
  options: CreateDriverShiftOptions = {},
): DriverShift {
  const startTime = new Date();
  startTime.setHours(8, 0, 0, 0);
  const endTime = new Date();
  endTime.setHours(17, 0, 0, 0);

  return createMockDriverShift({
    ...options,
    status: ShiftStatus.COMPLETED,
    actualStart: options.actualStart ?? startTime,
    actualEnd: options.actualEnd ?? endTime,
  });
}

/**
 * Creates an absent shift
 */
export function createAbsentShift(
  options: CreateDriverShiftOptions = {},
): DriverShift {
  return createMockDriverShift({
    ...options,
    status: ShiftStatus.ABSENT,
  });
}

/**
 * Creates a cancelled shift
 */
export function createCancelledShift(
  options: CreateDriverShiftOptions = {},
): DriverShift {
  return createMockDriverShift({
    ...options,
    status: ShiftStatus.CANCELLED,
  });
}

/**
 * Creates multiple mock shifts
 */
export function createMockDriverShifts(
  count: number,
  options: CreateDriverShiftOptions = {},
): DriverShift[] {
  return Array.from({ length: count }, (_, i) => {
    const shiftDate = new Date(today());
    shiftDate.setDate(shiftDate.getDate() + i);
    return createMockDriverShift({
      ...options,
      shiftDate,
    });
  });
}

/**
 * Creates a mock DriverShiftResponseDto
 */
export function createMockDriverShiftResponseDto(
  shift: DriverShift,
): DriverShiftResponseDto {
  return {
    id: shift.id,
    driverId: shift.driverId,
    shiftDate: shift.shiftDate,
    startTime: shift.startTime,
    endTime: shift.endTime,
    status: shift.status,
    actualStart: shift.actualStart,
    actualEnd: shift.actualEnd,
    createdAt: shift.createdAt,
    updatedAt: shift.updatedAt,
    driver: shift.driver
      ? {
          id: shift.driver.id,
          email: shift.driver.email,
          fullName: shift.driver.fullName,
          phone: shift.driver.phone,
          role: shift.driver.role,
          userSegment: shift.driver.userSegment,
          departmentId: shift.driver.departmentId,
          department: shift.driver.department,
          isActive: shift.driver.isActive,
          createdAt: shift.driver.createdAt,
          updatedAt: shift.driver.updatedAt,
        }
      : undefined,
  };
}
