import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PickupPoint } from './entities/pickup-point.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PickupPoint])],
  exports: [TypeOrmModule],
})
export class LocationsModule {}
