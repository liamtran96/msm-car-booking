import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GpsLocation } from './entities/gps-location.entity';

@Injectable()
export class GpsService {
  constructor(
    @InjectRepository(GpsLocation)
    private readonly gpsRepository: Repository<GpsLocation>,
  ) {}

  async getLatestPositions(): Promise<GpsLocation[]> {
    // Get latest position for each vehicle
    return this.gpsRepository
      .createQueryBuilder('gps')
      .distinctOn(['gps.vehicle_id'])
      .leftJoinAndSelect('gps.vehicle', 'vehicle')
      .orderBy('gps.vehicle_id')
      .addOrderBy('gps.recorded_at', 'DESC')
      .getMany();
  }

  async getVehicleHistory(
    vehicleId: string,
    hours: number = 1,
  ): Promise<GpsLocation[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.gpsRepository
      .createQueryBuilder('gps')
      .where('gps.vehicle_id = :vehicleId', { vehicleId })
      .andWhere('gps.recorded_at >= :since', { since })
      .orderBy('gps.recorded_at', 'DESC')
      .take(1000)
      .getMany();
  }

  async recordPosition(data: {
    vehicleId: string;
    latitude: number;
    longitude: number;
    speedKmh?: number;
    heading?: number;
  }): Promise<GpsLocation> {
    const location = this.gpsRepository.create({
      ...data,
      recordedAt: new Date(),
    });
    return this.gpsRepository.save(location);
  }
}
