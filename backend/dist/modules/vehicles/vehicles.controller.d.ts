import { VehiclesService } from './vehicles.service';
export declare class VehiclesController {
    private readonly vehiclesService;
    constructor(vehiclesService: VehiclesService);
    findAll(): Promise<import("./entities/vehicle.entity").Vehicle[]>;
    findAvailable(): Promise<import("./entities/vehicle.entity").Vehicle[]>;
    findOne(id: string): Promise<import("./entities/vehicle.entity").Vehicle>;
}
