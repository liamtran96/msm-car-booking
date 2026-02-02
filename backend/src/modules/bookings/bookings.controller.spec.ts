import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BookingStatus } from '../../common/enums';
import {
  createMockBooking,
  createPendingBooking,
  createMockBookings,
} from '../../test/factories/booking.factory';
import { generateUuid } from '../../test/utils/test-helper';
import { NotFoundException } from '@nestjs/common';

describe('BookingsController', () => {
  let controller: BookingsController;
  let findAllSpy: jest.Mock;
  let findByIdSpy: jest.Mock;
  let findByStatusSpy: jest.Mock;
  let findByDriverSpy: jest.Mock;

  beforeEach(async () => {
    findAllSpy = jest.fn();
    findByIdSpy = jest.fn();
    findByStatusSpy = jest.fn();
    findByDriverSpy = jest.fn();

    const mockService = {
      findAll: findAllSpy,
      findById: findByIdSpy,
      findByStatus: findByStatusSpy,
      findByDriver: findByDriverSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BookingsController>(BookingsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /bookings', () => {
    it('should return all bookings', async () => {
      const mockBookings = createMockBookings(10);
      findAllSpy.mockResolvedValue(mockBookings);

      const result = await controller.findAll();

      expect(result).toHaveLength(10);
      expect(findAllSpy).toHaveBeenCalled();
    });

    it('should filter bookings by status', async () => {
      const pendingBookings = [createPendingBooking(), createPendingBooking()];
      findByStatusSpy.mockResolvedValue(pendingBookings);

      const result = await controller.findAll(BookingStatus.PENDING);

      expect(result).toHaveLength(2);
      expect(findByStatusSpy).toHaveBeenCalledWith(BookingStatus.PENDING);
    });

    it('should return empty array when no bookings', async () => {
      findAllSpy.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('GET /bookings/:id', () => {
    it('should return booking by ID', async () => {
      const mockBooking = createMockBooking();
      findByIdSpy.mockResolvedValue(mockBooking);

      const result = await controller.findOne(mockBooking.id);

      expect(result.id).toBe(mockBooking.id);
      expect(findByIdSpy).toHaveBeenCalledWith(mockBooking.id);
    });

    it('should throw NotFoundException for non-existent booking', async () => {
      const nonExistentId = generateUuid();
      findByIdSpy.mockRejectedValue(
        new NotFoundException(`Booking with ID ${nonExistentId} not found`),
      );

      await expect(controller.findOne(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('GET /bookings/driver/:driverId', () => {
    it('should return bookings by driver ID', async () => {
      const driverId = generateUuid();
      const mockBookings = createMockBookings(5).map((booking) => ({
        ...booking,
        assignedDriverId: driverId,
      }));
      findByDriverSpy.mockResolvedValue(mockBookings);

      const result = await controller.findByDriver(driverId);

      expect(result).toHaveLength(5);
      expect(findByDriverSpy).toHaveBeenCalledWith(driverId);
    });

    it('should return empty array for driver with no bookings', async () => {
      const driverId = generateUuid();
      findByDriverSpy.mockResolvedValue([]);

      const result = await controller.findByDriver(driverId);

      expect(result).toHaveLength(0);
    });
  });
});
