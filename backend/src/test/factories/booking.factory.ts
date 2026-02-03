import { Booking } from '../../modules/bookings/entities/booking.entity';
import {
  BookingType,
  BookingStatus,
  DriverResponseStatus,
  ApprovalType,
} from '../../common/enums';
import {
  generateUuid,
  formatDate,
  formatTime,
  today,
} from '../utils/test-helper';
import { User } from '../../modules/users/entities/user.entity';
import { Department } from '../../modules/departments/entities/department.entity';
import { Vehicle } from '../../modules/vehicles/entities/vehicle.entity';

export interface CreateBookingOptions {
  id?: string;
  bookingCode?: string;
  requesterId?: string;
  departmentId?: string;
  bookingType?: BookingType;
  status?: BookingStatus;
  approvalType?: ApprovalType;
  isBusinessTrip?: boolean;
  scheduledDate?: Date;
  scheduledTime?: string;
  endDate?: Date;
  purpose?: string;
  passengerCount?: number;
  notes?: string;
  assignedVehicleId?: string;
  assignedDriverId?: string;
  driverResponse?: DriverResponseStatus;
  driverResponseAt?: Date;
  driverRejectionReason?: string;
  estimatedKm?: number;
  actualKm?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a mock Booking entity
 */
export function createMockBooking(options: CreateBookingOptions = {}): Booking {
  const now = new Date();
  const todayDate = today();
  const suffix = Date.now().toString().slice(-4);

  return {
    id: options.id ?? generateUuid(),
    bookingCode:
      options.bookingCode ??
      `MSM-${formatDate(todayDate).replace(/-/g, '')}-${suffix}`,
    requesterId: options.requesterId ?? generateUuid(),
    requester: undefined as unknown as User,
    departmentId: options.departmentId ?? generateUuid(),
    department: undefined as unknown as Department,
    bookingType: options.bookingType ?? BookingType.SINGLE_TRIP,
    status: options.status ?? BookingStatus.PENDING,
    approvalType: options.approvalType ?? ApprovalType.AUTO_APPROVED,
    isBusinessTrip: options.isBusinessTrip ?? true,
    scheduledDate: options.scheduledDate ?? todayDate,
    scheduledTime: options.scheduledTime ?? formatTime(9, 0),
    endDate: options.endDate ?? null!,
    purpose: options.purpose ?? 'Business meeting',
    passengerCount: options.passengerCount ?? 1,
    notes: options.notes ?? null!,
    assignedVehicleId: options.assignedVehicleId ?? null!,
    assignedVehicle: undefined as unknown as Vehicle,
    assignedDriverId: options.assignedDriverId ?? null!,
    assignedDriver: undefined as unknown as User,
    driverResponse: options.driverResponse ?? DriverResponseStatus.PENDING,
    driverResponseAt: options.driverResponseAt ?? null!,
    driverRejectionReason: options.driverRejectionReason ?? null!,
    estimatedKm: options.estimatedKm ?? 50,
    actualKm: options.actualKm ?? null!,
    cancelledAt: null!,
    cancelledById: null!,
    cancelledBy: undefined as unknown as User,
    cancellationReason: null!,
    cancellationNotes: null!,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Creates a pending booking
 */
export function createPendingBooking(
  options: CreateBookingOptions = {},
): Booking {
  return createMockBooking({
    ...options,
    status: BookingStatus.PENDING,
  });
}

/**
 * Creates a confirmed booking
 */
export function createConfirmedBooking(
  options: CreateBookingOptions = {},
): Booking {
  return createMockBooking({
    ...options,
    status: BookingStatus.CONFIRMED,
  });
}

/**
 * Creates an assigned booking
 */
export function createAssignedBooking(
  options: CreateBookingOptions = {},
): Booking {
  return createMockBooking({
    ...options,
    status: BookingStatus.ASSIGNED,
    assignedVehicleId: options.assignedVehicleId ?? generateUuid(),
    assignedDriverId: options.assignedDriverId ?? generateUuid(),
  });
}

/**
 * Creates an in-progress booking
 */
export function createInProgressBooking(
  options: CreateBookingOptions = {},
): Booking {
  return createMockBooking({
    ...options,
    status: BookingStatus.IN_PROGRESS,
    assignedVehicleId: options.assignedVehicleId ?? generateUuid(),
    assignedDriverId: options.assignedDriverId ?? generateUuid(),
  });
}

/**
 * Creates a completed booking
 */
export function createCompletedBooking(
  options: CreateBookingOptions = {},
): Booking {
  return createMockBooking({
    ...options,
    status: BookingStatus.COMPLETED,
    assignedVehicleId: options.assignedVehicleId ?? generateUuid(),
    assignedDriverId: options.assignedDriverId ?? generateUuid(),
    actualKm: options.actualKm ?? 45,
  });
}

/**
 * Creates a multi-stop booking
 */
export function createMultiStopBooking(
  options: CreateBookingOptions = {},
): Booking {
  return createMockBooking({
    ...options,
    bookingType: BookingType.MULTI_STOP,
  });
}

/**
 * Creates a block schedule booking
 */
export function createBlockScheduleBooking(
  options: CreateBookingOptions = {},
): Booking {
  const startDate = today();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  return createMockBooking({
    ...options,
    bookingType: BookingType.BLOCK_SCHEDULE,
    endDate: options.endDate ?? endDate,
  });
}

/**
 * Creates multiple mock bookings
 */
export function createMockBookings(
  count: number,
  options: CreateBookingOptions = {},
): Booking[] {
  return Array.from({ length: count }, (_, i) =>
    createMockBooking({
      ...options,
      bookingCode: `MSM-${formatDate(today()).replace(/-/g, '')}-${(1000 + i).toString()}`,
    }),
  );
}
