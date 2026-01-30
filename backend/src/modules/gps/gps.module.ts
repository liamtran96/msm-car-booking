import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpsService } from './gps.service';
import { GpsController } from './gps.controller';
import { GpsLocation } from './entities/gps-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GpsLocation])],
  controllers: [GpsController],
  providers: [GpsService],
  exports: [GpsService],
})
export class GpsModule {}
