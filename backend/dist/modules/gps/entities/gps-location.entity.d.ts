import { Vehicle } from '../../vehicles/entities/vehicle.entity';
export declare class GpsLocation {
    id: string;
    vehicleId: string;
    vehicle: Vehicle;
    latitude: number;
    longitude: number;
    speedKmh: number;
    heading: number;
    recordedAt: Date;
}
