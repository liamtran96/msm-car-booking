import { VehicleType, VehicleStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
export declare class Vehicle {
    id: string;
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
    capacity: number;
    vehicleType: VehicleType;
    status: VehicleStatus;
    currentOdometerKm: number;
    gpsDeviceId: string;
    assignedDriverId: string;
    assignedDriver: User;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
