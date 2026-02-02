import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from '../../common/enums';
import {
  createMockBooking,
  createPendingBooking,
  createConfirmedBooking,
  createMockBookings,
} from '../../test/factories/booking.factory';
import { createMockRepository } from '../../test/mocks/repository.mock';
import { generateUuid } from '../../test/utils/test-helper';
import { NotFoundException } from '@nestjs/common';

describe('BookingsService', () => {
  let service: BookingsService;
  let findSpy: jest.Mock;
  let findOneSpy: jest.Mock;

  const bookingRelations = [
    'requester',
    'department',
    'assignedVehicle',
    'assignedDriver',
  ];

  beforeEach(async () => {
    findSpy = jest.fn();
    findOneSpy = jest.fn();

    const mockRepository = {
      ...createMockRepository<Booking>(),
      find: findSpy,
      findOne: findOneSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all bookings', async () => {
      const mockBookings = createMockBookings(10);
      findSpy.mockResolvedValue(mockBookings);

      const result = await service.findAll();

      expect(result).toHaveLength(10);
      expect(findSpy).toHaveBeenCalledWith({
        relations: bookingRelations,
        order: { scheduledDate: 'DESC', scheduledTime: 'DESC' },
      });
    });

    it('should return empty array when no bookings', async () => {
      findSpy.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return booking by ID', async () => {
      const mockBooking = createMockBooking();
      findOneSpy.mockResolvedValue(mockBooking);

      const result = await service.findById(mockBooking.id);

      expect(result.id).toBe(mockBooking.id);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: mockBooking.id },
        relations: bookingRelations,
      });
    });

    it('should throw NotFoundException for non-existent booking', async () => {
      const nonExistentId = generateUuid();
      findOneSpy.mockResolvedValue(null);

      await expect(service.findById(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById(nonExistentId)).rejects.toThrow(
        `Booking with ID ${nonExistentId} not found`,
      );
    });
  });

  describe('findByStatus', () => {
    it('should return bookings by status', async () => {
      const pendingBookings = [createPendingBooking(), createPendingBooking()];
      findSpy.mockResolvedValue(pendingBookings);

      const result = await service.findByStatus(BookingStatus.PENDING);

      expect(result).toHaveLength(2);
      expect(findSpy).toHaveBeenCalledWith({
        where: { status: BookingStatus.PENDING },
        relations: bookingRelations,
        order: { scheduledDate: 'ASC', scheduledTime: 'ASC' },
      });
    });

    it('should return confirmed bookings', async () => {
      const confirmedBookings = [
        createConfirmedBooking(),
        createConfirmedBooking(),
      ];
      findSpy.mockResolvedValue(confirmedBookings);

      const result = await service.findByStatus(BookingStatus.CONFIRMED);

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no bookings with status', async () => {
      findSpy.mockResolvedValue([]);

      const result = await service.findByStatus(BookingStatus.CANCELLED);

      expect(result).toHaveLength(0);
    });
  });

  describe('findByDriver', () => {
    it('should return bookings by driver ID', async () => {
      const driverId = generateUuid();
      const driverBookings = createMockBookings(3).map((booking) => ({
        ...booking,
        assignedDriverId: driverId,
      }));
      findSpy.mockResolvedValue(driverBookings);

      const result = await service.findByDriver(driverId);

      expect(result).toHaveLength(3);
      expect(findSpy).toHaveBeenCalledWith({
        where: { assignedDriverId: driverId },
        relations: ['requester', 'department', 'assignedVehicle'],
        order: { scheduledDate: 'DESC', scheduledTime: 'DESC' },
      });
    });

    it('should return empty array for driver with no bookings', async () => {
      const driverId = generateUuid();
      findSpy.mockResolvedValue([]);

      const result = await service.findByDriver(driverId);

      expect(result).toHaveLength(0);
    });
  });
});
