import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { Vehicle } from './entities/vehicle.entity';
import { KmQuota } from './entities/km-quota.entity';
import { VehicleMaintenance } from './entities/vehicle-maintenance.entity';
import { OdometerLog } from './entities/odometer-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vehicle,
      KmQuota,
      VehicleMaintenance,
      OdometerLog,
    ]),
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService, TypeOrmModule],
})
export class VehiclesModule {}
