export declare enum UserRole {
    ADMIN = "ADMIN",
    PIC = "PIC",
    GA = "GA",
    DRIVER = "DRIVER",
    EMPLOYEE = "EMPLOYEE"
}
export declare enum UserSegment {
    DAILY = "DAILY",
    SOMETIMES = "SOMETIMES"
}
export declare enum VehicleType {
    SEDAN = "SEDAN",
    SUV = "SUV",
    VAN = "VAN",
    BUS = "BUS"
}
export declare enum VehicleStatus {
    AVAILABLE = "AVAILABLE",
    IN_USE = "IN_USE",
    MAINTENANCE = "MAINTENANCE",
    INACTIVE = "INACTIVE"
}
export declare enum PointType {
    FIXED = "FIXED",
    FLEXIBLE = "FLEXIBLE"
}
export declare enum BookingType {
    SINGLE_TRIP = "SINGLE_TRIP",
    MULTI_STOP = "MULTI_STOP",
    BLOCK_SCHEDULE = "BLOCK_SCHEDULE"
}
export declare enum BookingStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    ASSIGNED = "ASSIGNED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    REDIRECTED_EXTERNAL = "REDIRECTED_EXTERNAL"
}
export declare enum StopType {
    PICKUP = "PICKUP",
    DROP = "DROP",
    STOP = "STOP"
}
export declare enum CancellationReason {
    USER_REQUEST = "USER_REQUEST",
    NO_VEHICLE_AVAILABLE = "NO_VEHICLE_AVAILABLE",
    NO_DRIVER_AVAILABLE = "NO_DRIVER_AVAILABLE",
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
    VEHICLE_BREAKDOWN = "VEHICLE_BREAKDOWN",
    SCHEDULE_CONFLICT = "SCHEDULE_CONFLICT",
    WEATHER = "WEATHER",
    EMERGENCY = "EMERGENCY",
    DUPLICATE = "DUPLICATE",
    OTHER = "OTHER"
}
export declare enum ExternalProvider {
    GRAB = "GRAB",
    GOJEK = "GOJEK",
    BE = "BE",
    TAXI_MAI_LINH = "TAXI_MAI_LINH",
    TAXI_VINASUN = "TAXI_VINASUN",
    OTHER = "OTHER"
}
export declare enum ReadingType {
    TRIP_START = "TRIP_START",
    TRIP_END = "TRIP_END",
    DAILY_CHECK = "DAILY_CHECK"
}
export declare enum ShiftStatus {
    SCHEDULED = "SCHEDULED",
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    ABSENT = "ABSENT",
    CANCELLED = "CANCELLED"
}
export declare enum MaintenanceType {
    SCHEDULED = "SCHEDULED",
    REPAIR = "REPAIR",
    INSPECTION = "INSPECTION",
    TIRE_SERVICE = "TIRE_SERVICE",
    OIL_CHANGE = "OIL_CHANGE",
    CLEANING = "CLEANING",
    OTHER = "OTHER"
}
export declare enum NotificationChannel {
    APP_PUSH = "APP_PUSH",
    AUTO_CALL = "AUTO_CALL",
    SMS = "SMS"
}
export declare enum NotificationType {
    BOOKING_CONFIRMED = "BOOKING_CONFIRMED",
    VEHICLE_ARRIVING = "VEHICLE_ARRIVING",
    TRIP_STARTED = "TRIP_STARTED",
    TRIP_COMPLETED = "TRIP_COMPLETED",
    BOOKING_CANCELLED = "BOOKING_CANCELLED"
}
export declare enum NotificationStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    DELIVERED = "DELIVERED",
    FAILED = "FAILED"
}
