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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const booking_entity_1 = require("./entities/booking.entity");
let BookingsService = class BookingsService {
    bookingRepository;
    constructor(bookingRepository) {
        this.bookingRepository = bookingRepository;
    }
    async findAll() {
        return this.bookingRepository.find({
            relations: ['requester', 'department', 'assignedVehicle', 'assignedDriver'],
            order: { scheduledDate: 'DESC', scheduledTime: 'DESC' },
        });
    }
    async findById(id) {
        const booking = await this.bookingRepository.findOne({
            where: { id },
            relations: ['requester', 'department', 'assignedVehicle', 'assignedDriver'],
        });
        if (!booking) {
            throw new common_1.NotFoundException(`Booking with ID ${id} not found`);
        }
        return booking;
    }
    async findByStatus(status) {
        return this.bookingRepository.find({
            where: { status },
            relations: ['requester', 'department', 'assignedVehicle', 'assignedDriver'],
            order: { scheduledDate: 'ASC', scheduledTime: 'ASC' },
        });
    }
    async findByDriver(driverId) {
        return this.bookingRepository.find({
            where: { assignedDriverId: driverId },
            relations: ['requester', 'department', 'assignedVehicle'],
            order: { scheduledDate: 'DESC', scheduledTime: 'DESC' },
        });
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map