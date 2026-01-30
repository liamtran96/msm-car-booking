import { BookingsService } from './bookings.service';
import { BookingStatus } from '../../common/enums';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    findAll(status?: BookingStatus): Promise<import("./entities/booking.entity").Booking[]>;
    findOne(id: string): Promise<import("./entities/booking.entity").Booking>;
    findByDriver(driverId: string): Promise<import("./entities/booking.entity").Booking[]>;
}
