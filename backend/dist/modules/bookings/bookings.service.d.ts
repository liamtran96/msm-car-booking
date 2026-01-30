import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from '../../common/enums';
export declare class BookingsService {
    private readonly bookingRepository;
    constructor(bookingRepository: Repository<Booking>);
    findAll(): Promise<Booking[]>;
    findById(id: string): Promise<Booking>;
    findByStatus(status: BookingStatus): Promise<Booking[]>;
    findByDriver(driverId: string): Promise<Booking[]>;
}
