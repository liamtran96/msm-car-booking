import { GpsService } from './gps.service';
export declare class GpsController {
    private readonly gpsService;
    constructor(gpsService: GpsService);
    getLatestPositions(): Promise<import("./entities/gps-location.entity").GpsLocation[]>;
    getVehicleHistory(vehicleId: string, hours?: number): Promise<import("./entities/gps-location.entity").GpsLocation[]>;
}
