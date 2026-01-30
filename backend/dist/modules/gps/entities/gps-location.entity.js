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
exports.GpsLocation = void 0;
const typeorm_1 = require("typeorm");
const vehicle_entity_1 = require("../../vehicles/entities/vehicle.entity");
let GpsLocation = class GpsLocation {
    id;
    vehicleId;
    vehicle;
    latitude;
    longitude;
    speedKmh;
    heading;
    recordedAt;
};
exports.GpsLocation = GpsLocation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GpsLocation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vehicle_id' }),
    __metadata("design:type", String)
], GpsLocation.prototype, "vehicleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vehicle_entity_1.Vehicle),
    (0, typeorm_1.JoinColumn)({ name: 'vehicle_id' }),
    __metadata("design:type", vehicle_entity_1.Vehicle)
], GpsLocation.prototype, "vehicle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 8 }),
    __metadata("design:type", Number)
], GpsLocation.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 11, scale: 8 }),
    __metadata("design:type", Number)
], GpsLocation.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'speed_kmh', type: 'decimal', precision: 6, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], GpsLocation.prototype, "speedKmh", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], GpsLocation.prototype, "heading", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recorded_at' }),
    __metadata("design:type", Date)
], GpsLocation.prototype, "recordedAt", void 0);
exports.GpsLocation = GpsLocation = __decorate([
    (0, typeorm_1.Entity)('gps_locations')
], GpsLocation);
//# sourceMappingURL=gps-location.entity.js.map