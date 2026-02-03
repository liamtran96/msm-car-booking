export const UserRole = {
  ADMIN: 'ADMIN',
  PIC: 'PIC',
  GA: 'GA',
  DRIVER: 'DRIVER',
  EMPLOYEE: 'EMPLOYEE',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserSegment = {
  DAILY: 'DAILY',
  SOMETIMES: 'SOMETIMES',
} as const;
export type UserSegment = (typeof UserSegment)[keyof typeof UserSegment];

export const PositionLevel = {
  STAFF: 'STAFF',
  SENIOR: 'SENIOR',
  TEAM_LEAD: 'TEAM_LEAD',
  MGR: 'MGR',
  SR_MGR: 'SR_MGR',
  DIRECTOR: 'DIRECTOR',
  VP: 'VP',
  C_LEVEL: 'C_LEVEL',
} as const;
export type PositionLevel = (typeof PositionLevel)[keyof typeof PositionLevel];

export const VehicleType = {
  SEDAN: 'SEDAN',
  SUV: 'SUV',
  VAN: 'VAN',
  BUS: 'BUS',
} as const;
export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType];

export const VehicleStatus = {
  AVAILABLE: 'AVAILABLE',
  IN_USE: 'IN_USE',
  MAINTENANCE: 'MAINTENANCE',
  INACTIVE: 'INACTIVE',
} as const;
export type VehicleStatus = (typeof VehicleStatus)[keyof typeof VehicleStatus];

export const BookingType = {
  SINGLE_TRIP: 'SINGLE_TRIP',
  MULTI_STOP: 'MULTI_STOP',
  BLOCK_SCHEDULE: 'BLOCK_SCHEDULE',
} as const;
export type BookingType = (typeof BookingType)[keyof typeof BookingType];

export const BookingStatus = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REDIRECTED_EXTERNAL: 'REDIRECTED_EXTERNAL',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const ApprovalType = {
  MANAGER_APPROVAL: 'MANAGER_APPROVAL',
  CC_ONLY: 'CC_ONLY',
  AUTO_APPROVED: 'AUTO_APPROVED',
} as const;
export type ApprovalType = (typeof ApprovalType)[keyof typeof ApprovalType];

export const ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  AUTO_APPROVED: 'AUTO_APPROVED',
  EXPIRED: 'EXPIRED',
} as const;
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const NotificationType = {
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  VEHICLE_ARRIVING: 'VEHICLE_ARRIVING',
  TRIP_STARTED: 'TRIP_STARTED',
  TRIP_COMPLETED: 'TRIP_COMPLETED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  APPROVAL_REMINDER: 'APPROVAL_REMINDER',
  BOOKING_APPROVED: 'BOOKING_APPROVED',
  BOOKING_REJECTED: 'BOOKING_REJECTED',
  BOOKING_CC_NOTIFICATION: 'BOOKING_CC_NOTIFICATION',
  NEW_CHAT_MESSAGE: 'NEW_CHAT_MESSAGE',
  SCHEDULE_CHANGE_ALERT: 'SCHEDULE_CHANGE_ALERT',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const ExternalProvider = {
  GRAB: 'GRAB',
  GOJEK: 'GOJEK',
  BE: 'BE',
  TAXI_MAI_LINH: 'TAXI_MAI_LINH',
  TAXI_VINASUN: 'TAXI_VINASUN',
  OTHER: 'OTHER',
} as const;
export type ExternalProvider = (typeof ExternalProvider)[keyof typeof ExternalProvider];
