"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const user_entity_1 = require("../../users/entities/user.entity");
const department_entity_1 = require("../../departments/entities/department.entity");
const vehicle_entity_1 = require("../../vehicles/entities/vehicle.entity");
let Booking = class Booking {
    id;
    bookingCode;
    requesterId;
    requester;
    departmentId;
    department;
    bookingType;
    status;
    scheduledDate;
    scheduledTime;
    endDate;
    purpose;
    passengerCount;
    notes;
    assignedVehicleId;
    assignedVehicle;
    assignedDriverId;
    assignedDriver;
    estimatedKm;
    actualKm;
    cancelledAt;
    cancelledById;
    cancelledBy;
    cancellationReason;
    cancellationNotes;
    createdAt;
    updatedAt;
};
exports.Booking = Booking;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Booking.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'booking_code', unique: true }),
    __metadata("design:type", String)
], Booking.prototype, "bookingCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requester_id' }),
    __metadata("design:type", String)
], Booking.prototype, "requesterId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'requester_id' }),
    __metadata("design:type", user_entity_1.User)
], Booking.prototype, "requester", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'department_id', nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'department_id' }),
    __metadata("design:type", department_entity_1.Department)
], Booking.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'booking_type', type: 'enum', enum: enums_1.BookingType }),
    __metadata("design:type", String)
], Booking.prototype, "bookingType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.BookingStatus, default: enums_1.BookingStatus.PENDING }),
    __metadata("design:type", String)
], Booking.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scheduled_date', type: 'date' }),
    __metadata("design:type", Date)
], Booking.prototype, "scheduledDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scheduled_time', type: 'time' }),
    __metadata("design:type", String)
], Booking.prototype, "scheduledTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Booking.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "purpose", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'passenger_count' }),
    __metadata("design:type", Number)
], Booking.prototype, "passengerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_vehicle_id', nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "assignedVehicleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vehicle_entity_1.Vehicle, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_vehicle_id' }),
    __metadata("design:type", vehicle_entity_1.Vehicle)
], Booking.prototype, "assignedVehicle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_driver_id', nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "assignedDriverId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_driver_id' }),
    __metadata("design:type", user_entity_1.User)
], Booking.prototype, "assignedDriver", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estimated_km', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Booking.prototype, "estimatedKm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actual_km', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Booking.prototype, "actualKm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancelled_at', nullable: true }),
    __metadata("design:type", Date)
], Booking.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancelled_by', nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "cancelledById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'cancelled_by' }),
    __metadata("design:type", user_entity_1.User)
], Booking.prototype, "cancelledBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancellation_reason', type: 'enum', enum: enums_1.CancellationReason, nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "cancellationReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancellation_notes', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "cancellationNotes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Booking.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Booking.prototype, "updatedAt", void 0);
exports.Booking = Booking = __decorate([
    (0, typeorm_1.Entity)('bookings')
], Booking);
//# sourceMappingURL=booking.entity.js.map