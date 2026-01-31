import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { BookingSequence } from './entities/booking-sequence.entity';
import { TripStop } from './entities/trip-stop.entity';
import { TripEvent } from './entities/trip-event.entity';
import { TripReport } from './entities/trip-report.entity';
import { TripExpense } from './entities/trip-expense.entity';
import { ExternalDispatch } from './entities/external-dispatch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingSequence,
      TripStop,
      TripEvent,
      TripReport,
      TripExpense,
      ExternalDispatch,
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService, TypeOrmModule],
})
export class BookingsModule {}
