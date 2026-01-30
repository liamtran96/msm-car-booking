import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleStatus } from '../../common/enums';
export declare class VehiclesService {
    private readonly vehicleRepository;
    constructor(vehicleRepository: Repository<Vehicle>);
    findAll(): Promise<Vehicle[]>;
    findAvailable(): Promise<Vehicle[]>;
    findById(id: string): Promise<Vehicle>;
    updateStatus(id: string, status: VehicleStatus): Promise<Vehicle>;
}
