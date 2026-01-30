import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleStatus } from '../../common/enums';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      where: { isActive: true },
      relations: ['assignedDriver'],
    });
  }

  async findAvailable(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      where: { isActive: true, status: VehicleStatus.AVAILABLE },
      relations: ['assignedDriver'],
    });
  }

  async findById(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['assignedDriver'],
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async updateStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
    const vehicle = await this.findById(id);
    vehicle.status = status;
    return this.vehicleRepository.save(vehicle);
  }
}
