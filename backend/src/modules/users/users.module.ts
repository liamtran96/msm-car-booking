import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DriverShiftsService } from './driver-shifts.service';
import { DriverShiftsController } from './driver-shifts.controller';
import { User } from './entities/user.entity';
import { DriverShift } from './entities/driver-shift.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, DriverShift])],
  controllers: [UsersController, DriverShiftsController],
  providers: [UsersService, DriverShiftsService],
  exports: [UsersService, DriverShiftsService, TypeOrmModule],
})
export class UsersModule {}
