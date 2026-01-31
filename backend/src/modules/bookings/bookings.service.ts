import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from '../../common/enums';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async findAll(): Promise<Booking[]> {
    return this.bookingRepository.find({
      relations: [
        'requester',
        'department',
        'assignedVehicle',
        'assignedDriver',
      ],
      order: { scheduledDate: 'DESC', scheduledTime: 'DESC' },
    });
  }

  async findById(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: [
        'requester',
        'department',
        'assignedVehicle',
        'assignedDriver',
      ],
    });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async findByStatus(status: BookingStatus): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { status },
      relations: [
        'requester',
        'department',
        'assignedVehicle',
        'assignedDriver',
      ],
      order: { scheduledDate: 'ASC', scheduledTime: 'ASC' },
    });
  }

  async findByDriver(driverId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { assignedDriverId: driverId },
      relations: ['requester', 'department', 'assignedVehicle'],
      order: { scheduledDate: 'DESC', scheduledTime: 'DESC' },
    });
  }
}
