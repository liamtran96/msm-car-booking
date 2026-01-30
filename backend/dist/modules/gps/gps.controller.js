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
exports.GpsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const gps_service_1 = require("./gps.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let GpsController = class GpsController {
    gpsService;
    constructor(gpsService) {
        this.gpsService = gpsService;
    }
    getLatestPositions() {
        return this.gpsService.getLatestPositions();
    }
    getVehicleHistory(vehicleId, hours) {
        return this.gpsService.getVehicleHistory(vehicleId, hours || 1);
    }
};
exports.GpsController = GpsController;
__decorate([
    (0, common_1.Get)('positions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get latest positions for all vehicles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GpsController.prototype, "getLatestPositions", null);
__decorate([
    (0, common_1.Get)('vehicle/:vehicleId/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get GPS history for a vehicle' }),
    (0, swagger_1.ApiQuery)({ name: 'hours', required: false, type: Number }),
    __param(0, (0, common_1.Param)('vehicleId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('hours')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], GpsController.prototype, "getVehicleHistory", null);
exports.GpsController = GpsController = __decorate([
    (0, swagger_1.ApiTags)('gps'),
    (0, common_1.Controller)('gps'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [gps_service_1.GpsService])
], GpsController);
//# sourceMappingURL=gps.controller.js.map