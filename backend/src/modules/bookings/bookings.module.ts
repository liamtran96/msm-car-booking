import { Module, forwardRef } from '@nestjs/common';
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
import { User } from '../users/entities/user.entity';
import { ApprovalsModule } from '../approvals/approvals.module';
import { ChatModule } from '../chat/chat.module';

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
      User,
    ]),
    forwardRef(() => ApprovalsModule),
    forwardRef(() => ChatModule),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService, TypeOrmModule],
})
export class BookingsModule {}
