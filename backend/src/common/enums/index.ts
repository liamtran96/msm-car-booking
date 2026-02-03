// User enums
export enum UserRole {
  ADMIN = 'ADMIN',
  PIC = 'PIC',
  GA = 'GA',
  DRIVER = 'DRIVER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum UserSegment {
  DAILY = 'DAILY',
  SOMETIMES = 'SOMETIMES',
}

// Position level for approval workflow
export enum PositionLevel {
  STAFF = 'STAFF',
  SENIOR = 'SENIOR',
  TEAM_LEAD = 'TEAM_LEAD',
  MGR = 'MGR',
  SR_MGR = 'SR_MGR',
  DIRECTOR = 'DIRECTOR',
  VP = 'VP',
  C_LEVEL = 'C_LEVEL',
}

// Define management level threshold (MGR and above auto-approve)
export const MANAGEMENT_LEVELS: PositionLevel[] = [
  PositionLevel.MGR,
  PositionLevel.SR_MGR,
  PositionLevel.DIRECTOR,
  PositionLevel.VP,
  PositionLevel.C_LEVEL,
];

// Vehicle enums
export enum VehicleType {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  VAN = 'VAN',
  BUS = 'BUS',
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE',
}

// Pickup point enums
export enum PointType {
  FIXED = 'FIXED',
  FLEXIBLE = 'FLEXIBLE',
}

// Booking enums
export enum BookingType {
  SINGLE_TRIP = 'SINGLE_TRIP',
  MULTI_STOP = 'MULTI_STOP',
  BLOCK_SCHEDULE = 'BLOCK_SCHEDULE',
}

export enum BookingStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REDIRECTED_EXTERNAL = 'REDIRECTED_EXTERNAL',
}

// Approval workflow enums
export enum ApprovalType {
  MANAGER_APPROVAL = 'MANAGER_APPROVAL',
  CC_ONLY = 'CC_ONLY',
  AUTO_APPROVED = 'AUTO_APPROVED',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  AUTO_APPROVED = 'AUTO_APPROVED',
  EXPIRED = 'EXPIRED',
}

export enum StopType {
  PICKUP = 'PICKUP',
  DROP = 'DROP',
  STOP = 'STOP',
}

export enum CancellationReason {
  USER_REQUEST = 'USER_REQUEST',
  NO_VEHICLE_AVAILABLE = 'NO_VEHICLE_AVAILABLE',
  NO_DRIVER_AVAILABLE = 'NO_DRIVER_AVAILABLE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  VEHICLE_BREAKDOWN = 'VEHICLE_BREAKDOWN',
  SCHEDULE_CONFLICT = 'SCHEDULE_CONFLICT',
  WEATHER = 'WEATHER',
  EMERGENCY = 'EMERGENCY',
  DUPLICATE = 'DUPLICATE',
  OTHER = 'OTHER',
}

// External provider enums
export enum ExternalProvider {
  GRAB = 'GRAB',
  GOJEK = 'GOJEK',
  BE = 'BE',
  TAXI_MAI_LINH = 'TAXI_MAI_LINH',
  TAXI_VINASUN = 'TAXI_VINASUN',
  OTHER = 'OTHER',
}

// Odometer enums
export enum ReadingType {
  TRIP_START = 'TRIP_START',
  TRIP_END = 'TRIP_END',
  DAILY_CHECK = 'DAILY_CHECK',
}

// Shift enums
export enum ShiftStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ABSENT = 'ABSENT',
  CANCELLED = 'CANCELLED',
}

// Maintenance enums
export enum MaintenanceType {
  SCHEDULED = 'SCHEDULED',
  REPAIR = 'REPAIR',
  INSPECTION = 'INSPECTION',
  TIRE_SERVICE = 'TIRE_SERVICE',
  OIL_CHANGE = 'OIL_CHANGE',
  CLEANING = 'CLEANING',
  OTHER = 'OTHER',
}

// Notification enums
export enum NotificationChannel {
  APP_PUSH = 'APP_PUSH',
  AUTO_CALL = 'AUTO_CALL',
  SMS = 'SMS',
}

export enum NotificationType {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  VEHICLE_ARRIVING = 'VEHICLE_ARRIVING',
  TRIP_STARTED = 'TRIP_STARTED',
  TRIP_COMPLETED = 'TRIP_COMPLETED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  // Approval workflow notifications
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
  APPROVAL_REMINDER = 'APPROVAL_REMINDER',
  BOOKING_APPROVED = 'BOOKING_APPROVED',
  BOOKING_REJECTED = 'BOOKING_REJECTED',
  BOOKING_CC_NOTIFICATION = 'BOOKING_CC_NOTIFICATION',
  // Chat notifications
  NEW_CHAT_MESSAGE = 'NEW_CHAT_MESSAGE',
  SCHEDULE_CHANGE_ALERT = 'SCHEDULE_CHANGE_ALERT',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

// Driver response enums (Driver App)
export enum DriverResponseStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  NO_RESPONSE = 'NO_RESPONSE',
}

// Expense enums (Driver App)
export enum ExpenseType {
  TOLL = 'TOLL',
  PARKING = 'PARKING',
  FUEL = 'FUEL',
  REPAIR = 'REPAIR',
  OTHER = 'OTHER',
}

// Trip event enums (Driver App)
export enum TripEventType {
  DRIVER_ACCEPTED = 'DRIVER_ACCEPTED',
  DRIVER_REJECTED = 'DRIVER_REJECTED',
  TRIP_STARTED = 'TRIP_STARTED',
  ARRIVED_PICKUP = 'ARRIVED_PICKUP',
  PASSENGER_BOARDED = 'PASSENGER_BOARDED',
  ARRIVED_STOP = 'ARRIVED_STOP',
  ARRIVED_DESTINATION = 'ARRIVED_DESTINATION',
  TRIP_COMPLETED = 'TRIP_COMPLETED',
  ODOMETER_RECORDED = 'ODOMETER_RECORDED',
  EXPENSE_ADDED = 'EXPENSE_ADDED',
  AUTO_CALL_TRIGGERED = 'AUTO_CALL_TRIGGERED',
}

// Chat enums
export enum ChatRoomStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  CLOSED = 'CLOSED',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}
