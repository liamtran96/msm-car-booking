"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationStatus = exports.NotificationType = exports.NotificationChannel = exports.MaintenanceType = exports.ShiftStatus = exports.ReadingType = exports.ExternalProvider = exports.CancellationReason = exports.StopType = exports.BookingStatus = exports.BookingType = exports.PointType = exports.VehicleStatus = exports.VehicleType = exports.UserSegment = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["PIC"] = "PIC";
    UserRole["GA"] = "GA";
    UserRole["DRIVER"] = "DRIVER";
    UserRole["EMPLOYEE"] = "EMPLOYEE";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserSegment;
(function (UserSegment) {
    UserSegment["DAILY"] = "DAILY";
    UserSegment["SOMETIMES"] = "SOMETIMES";
})(UserSegment || (exports.UserSegment = UserSegment = {}));
var VehicleType;
(function (VehicleType) {
    VehicleType["SEDAN"] = "SEDAN";
    VehicleType["SUV"] = "SUV";
    VehicleType["VAN"] = "VAN";
    VehicleType["BUS"] = "BUS";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
var VehicleStatus;
(function (VehicleStatus) {
    VehicleStatus["AVAILABLE"] = "AVAILABLE";
    VehicleStatus["IN_USE"] = "IN_USE";
    VehicleStatus["MAINTENANCE"] = "MAINTENANCE";
    VehicleStatus["INACTIVE"] = "INACTIVE";
})(VehicleStatus || (exports.VehicleStatus = VehicleStatus = {}));
var PointType;
(function (PointType) {
    PointType["FIXED"] = "FIXED";
    PointType["FLEXIBLE"] = "FLEXIBLE";
})(PointType || (exports.PointType = PointType = {}));
var BookingType;
(function (BookingType) {
    BookingType["SINGLE_TRIP"] = "SINGLE_TRIP";
    BookingType["MULTI_STOP"] = "MULTI_STOP";
    BookingType["BLOCK_SCHEDULE"] = "BLOCK_SCHEDULE";
})(BookingType || (exports.BookingType = BookingType = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "PENDING";
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["ASSIGNED"] = "ASSIGNED";
    BookingStatus["IN_PROGRESS"] = "IN_PROGRESS";
    BookingStatus["COMPLETED"] = "COMPLETED";
    BookingStatus["CANCELLED"] = "CANCELLED";
    BookingStatus["REDIRECTED_EXTERNAL"] = "REDIRECTED_EXTERNAL";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var StopType;
(function (StopType) {
    StopType["PICKUP"] = "PICKUP";
    StopType["DROP"] = "DROP";
    StopType["STOP"] = "STOP";
})(StopType || (exports.StopType = StopType = {}));
var CancellationReason;
(function (CancellationReason) {
    CancellationReason["USER_REQUEST"] = "USER_REQUEST";
    CancellationReason["NO_VEHICLE_AVAILABLE"] = "NO_VEHICLE_AVAILABLE";
    CancellationReason["NO_DRIVER_AVAILABLE"] = "NO_DRIVER_AVAILABLE";
    CancellationReason["QUOTA_EXCEEDED"] = "QUOTA_EXCEEDED";
    CancellationReason["VEHICLE_BREAKDOWN"] = "VEHICLE_BREAKDOWN";
    CancellationReason["SCHEDULE_CONFLICT"] = "SCHEDULE_CONFLICT";
    CancellationReason["WEATHER"] = "WEATHER";
    CancellationReason["EMERGENCY"] = "EMERGENCY";
    CancellationReason["DUPLICATE"] = "DUPLICATE";
    CancellationReason["OTHER"] = "OTHER";
})(CancellationReason || (exports.CancellationReason = CancellationReason = {}));
var ExternalProvider;
(function (ExternalProvider) {
    ExternalProvider["GRAB"] = "GRAB";
    ExternalProvider["GOJEK"] = "GOJEK";
    ExternalProvider["BE"] = "BE";
    ExternalProvider["TAXI_MAI_LINH"] = "TAXI_MAI_LINH";
    ExternalProvider["TAXI_VINASUN"] = "TAXI_VINASUN";
    ExternalProvider["OTHER"] = "OTHER";
})(ExternalProvider || (exports.ExternalProvider = ExternalProvider = {}));
var ReadingType;
(function (ReadingType) {
    ReadingType["TRIP_START"] = "TRIP_START";
    ReadingType["TRIP_END"] = "TRIP_END";
    ReadingType["DAILY_CHECK"] = "DAILY_CHECK";
})(ReadingType || (exports.ReadingType = ReadingType = {}));
var ShiftStatus;
(function (ShiftStatus) {
    ShiftStatus["SCHEDULED"] = "SCHEDULED";
    ShiftStatus["ACTIVE"] = "ACTIVE";
    ShiftStatus["COMPLETED"] = "COMPLETED";
    ShiftStatus["ABSENT"] = "ABSENT";
    ShiftStatus["CANCELLED"] = "CANCELLED";
})(ShiftStatus || (exports.ShiftStatus = ShiftStatus = {}));
var MaintenanceType;
(function (MaintenanceType) {
    MaintenanceType["SCHEDULED"] = "SCHEDULED";
    MaintenanceType["REPAIR"] = "REPAIR";
    MaintenanceType["INSPECTION"] = "INSPECTION";
    MaintenanceType["TIRE_SERVICE"] = "TIRE_SERVICE";
    MaintenanceType["OIL_CHANGE"] = "OIL_CHANGE";
    MaintenanceType["CLEANING"] = "CLEANING";
    MaintenanceType["OTHER"] = "OTHER";
})(MaintenanceType || (exports.MaintenanceType = MaintenanceType = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["APP_PUSH"] = "APP_PUSH";
    NotificationChannel["AUTO_CALL"] = "AUTO_CALL";
    NotificationChannel["SMS"] = "SMS";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["BOOKING_CONFIRMED"] = "BOOKING_CONFIRMED";
    NotificationType["VEHICLE_ARRIVING"] = "VEHICLE_ARRIVING";
    NotificationType["TRIP_STARTED"] = "TRIP_STARTED";
    NotificationType["TRIP_COMPLETED"] = "TRIP_COMPLETED";
    NotificationType["BOOKING_CANCELLED"] = "BOOKING_CANCELLED";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["PENDING"] = "PENDING";
    NotificationStatus["SENT"] = "SENT";
    NotificationStatus["DELIVERED"] = "DELIVERED";
    NotificationStatus["FAILED"] = "FAILED";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
//# sourceMappingURL=index.js.map