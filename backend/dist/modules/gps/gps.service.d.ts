import { Repository } from 'typeorm';
import { GpsLocation } from './entities/gps-location.entity';
export declare class GpsService {
    private readonly gpsRepository;
    constructor(gpsRepository: Repository<GpsLocation>);
    getLatestPositions(): Promise<GpsLocation[]>;
    getVehicleHistory(vehicleId: string, hours?: number): Promise<GpsLocation[]>;
    recordPosition(data: {
        vehicleId: string;
        latitude: number;
        longitude: number;
        speedKmh?: number;
        heading?: number;
    }): Promise<GpsLocation>;
}
