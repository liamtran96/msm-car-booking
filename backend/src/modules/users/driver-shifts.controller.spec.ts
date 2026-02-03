import { Test, TestingModule } from '@nestjs/testing';
import { DriverShiftsController } from './driver-shifts.controller';
import { DriverShiftsService } from './driver-shifts.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import {
  CreateDriverShiftDto,
  UpdateDriverShiftDto,
  DriverShiftFilterDto,
} from './dto/driver-shift.dto';
import { ShiftStatus } from '../../common/enums';
import {
  createMockDriverShift,
  createScheduledShift,
  createActiveShift,
  createMockDriverShiftResponseDto,
  createMockDriverShifts,
} from '../../test/factories/driver-shift.factory';
import { createMockDriver } from '../../test/factories/user.factory';
import {
  generateUuid,
  today,
  formatTime,
  formatDate,
} from '../../test/utils/test-helper';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

describe('DriverShiftsController', () => {
  let controller: DriverShiftsController;
  let createSpy: jest.Mock;
  let findAllSpy: jest.Mock;
  let findByIdSpy: jest.Mock;
  let findByDriverIdSpy: jest.Mock;
  let findTodayShiftsSpy: jest.Mock;
  let findAvailableDriversForTimeSpy: jest.Mock;
  let updateSpy: jest.Mock;
  let startShiftSpy: jest.Mock;
  let endShiftSpy: jest.Mock;
  let cancelShiftSpy: jest.Mock;
  let markAbsentSpy: jest.Mock;
  let removeSpy: jest.Mock;

  beforeEach(async () => {
    createSpy = jest.fn();
    findAllSpy = jest.fn();
    findByIdSpy = jest.fn();
    findByDriverIdSpy = jest.fn();
    findTodayShiftsSpy = jest.fn();
    findAvailableDriversForTimeSpy = jest.fn();
    updateSpy = jest.fn();
    startShiftSpy = jest.fn();
    endShiftSpy = jest.fn();
    cancelShiftSpy = jest.fn();
    markAbsentSpy = jest.fn();
    removeSpy = jest.fn();

    const mockService = {
      create: createSpy,
      findAll: findAllSpy,
      findById: findByIdSpy,
      findByDriverId: findByDriverIdSpy,
      findTodayShifts: findTodayShiftsSpy,
      findAvailableDriversForTime: findAvailableDriversForTimeSpy,
      update: updateSpy,
      startShift: startShiftSpy,
      endShift: endShiftSpy,
      cancelShift: cancelShiftSpy,
      markAbsent: markAbsentSpy,
      remove: removeSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverShiftsController],
      providers: [
        {
          provide: DriverShiftsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DriverShiftsController>(DriverShiftsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /driver-shifts', () => {
    const createDto: CreateDriverShiftDto = {
      driverId: generateUuid(),
      shiftDate: formatDate(today()),
      startTime: formatTime(8, 0),
      endTime: formatTime(17, 0),
    };

    it('should create a driver shift', async () => {
      const mockShift = createMockDriverShift({
        driverId: createDto.driverId,
        startTime: createDto.startTime,
        endTime: createDto.endTime,
      });
      const mockResponse = createMockDriverShiftResponseDto(mockShift);
      createSpy.mockResolvedValue(mockResponse);

      const result = await controller.create(createDto);

      expect(result.driverId).toBe(createDto.driverId);
      expect(createSpy).toHaveBeenCalledWith(createDto);
    });

    it('should throw BadRequestException for invalid time range', async () => {
      createSpy.mockRejectedValue(
        new BadRequestException('End time must be after start time'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException for duplicate shift', async () => {
      createSpy.mockRejectedValue(
        new ConflictException(
          'Driver already has a shift scheduled for this date',
        ),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('GET /driver-shifts', () => {
    it('should return all shifts', async () => {
      const mockShifts = createMockDriverShifts(5);
      const mockResponses = mockShifts.map(createMockDriverShiftResponseDto);
      findAllSpy.mockResolvedValue(mockResponses);

      const filterDto: DriverShiftFilterDto = {};
      const result = await controller.findAll(filterDto);

      expect(result).toHaveLength(5);
      expect(findAllSpy).toHaveBeenCalledWith(filterDto);
    });

    it('should filter shifts by date', async () => {
      const mockShifts = createMockDriverShifts(3);
      const mockResponses = mockShifts.map(createMockDriverShiftResponseDto);
      findAllSpy.mockResolvedValue(mockResponses);

      const filterDto: DriverShiftFilterDto = { date: formatDate(today()) };
      const result = await controller.findAll(filterDto);

      expect(result).toHaveLength(3);
    });

    it('should filter shifts by status', async () => {
      const mockShifts = [createActiveShift(), createActiveShift()];
      const mockResponses = mockShifts.map(createMockDriverShiftResponseDto);
      findAllSpy.mockResolvedValue(mockResponses);

      const filterDto: DriverShiftFilterDto = { status: ShiftStatus.ACTIVE };
      const result = await controller.findAll(filterDto);

      expect(result).toHaveLength(2);
    });
  });

  describe('GET /driver-shifts/today', () => {
    it("should return today's shifts", async () => {
      const mockShifts = createMockDriverShifts(4);
      const mockResponses = mockShifts.map(createMockDriverShiftResponseDto);
      findTodayShiftsSpy.mockResolvedValue(mockResponses);

      const result = await controller.findTodayShifts();

      expect(result).toHaveLength(4);
      expect(findTodayShiftsSpy).toHaveBeenCalled();
    });
  });

  describe('GET /driver-shifts/available', () => {
    it('should return available drivers for time', async () => {
      const mockShifts = createMockDriverShifts(2);
      const mockResponses = mockShifts.map(createMockDriverShiftResponseDto);
      findAvailableDriversForTimeSpy.mockResolvedValue(mockResponses);

      const result = await controller.findAvailableDrivers(
        formatDate(today()),
        formatTime(10, 0),
      );

      expect(result).toHaveLength(2);
      expect(findAvailableDriversForTimeSpy).toHaveBeenCalledWith(
        formatDate(today()),
        formatTime(10, 0),
      );
    });
  });

  describe('GET /driver-shifts/my-shifts', () => {
    it("should return current driver's shifts", async () => {
      const driver = createMockDriver();
      const mockShifts = createMockDriverShifts(3, { driverId: driver.id });
      const mockResponses = mockShifts.map(createMockDriverShiftResponseDto);
      findByDriverIdSpy.mockResolvedValue(mockResponses);

      const result = await controller.findMyShifts(driver);

      expect(result).toHaveLength(3);
      expect(findByDriverIdSpy).toHaveBeenCalledWith(driver.id);
    });
  });

  describe('GET /driver-shifts/driver/:driverId', () => {
    it('should return shifts by driver ID', async () => {
      const driverId = generateUuid();
      const mockShifts = createMockDriverShifts(3, { driverId });
      const mockResponses = mockShifts.map(createMockDriverShiftResponseDto);
      findByDriverIdSpy.mockResolvedValue(mockResponses);

      const result = await controller.findByDriverId(driverId);

      expect(result).toHaveLength(3);
      expect(findByDriverIdSpy).toHaveBeenCalledWith(driverId);
    });
  });

  describe('GET /driver-shifts/:id', () => {
    it('should return shift by ID', async () => {
      const mockShift = createMockDriverShift();
      const mockResponse = createMockDriverShiftResponseDto(mockShift);
      findByIdSpy.mockResolvedValue(mockResponse);

      const result = await controller.findOne(mockShift.id);

      expect(result.id).toBe(mockShift.id);
      expect(findByIdSpy).toHaveBeenCalledWith(mockShift.id);
    });

    it('should throw NotFoundException for non-existent shift', async () => {
      const nonExistentId = generateUuid();
      findByIdSpy.mockRejectedValue(
        new NotFoundException(
          `Driver shift with ID ${nonExistentId} not found`,
        ),
      );

      await expect(controller.findOne(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PATCH /driver-shifts/:id', () => {
    it('should update shift', async () => {
      const mockShift = createMockDriverShift();
      const updateDto: UpdateDriverShiftDto = { endTime: formatTime(18, 0) };
      const updatedShift = {
        ...mockShift,
        endTime: updateDto.endTime as string,
      };
      const mockResponse = createMockDriverShiftResponseDto(updatedShift);
      updateSpy.mockResolvedValue(mockResponse);

      const result = await controller.update(mockShift.id, updateDto);

      expect(result.endTime).toBe(formatTime(18, 0));
      expect(updateSpy).toHaveBeenCalledWith(mockShift.id, updateDto);
    });
  });

  describe('PATCH /driver-shifts/:id/start', () => {
    it('should start shift', async () => {
      const driver = createMockDriver();
      const mockShift = createScheduledShift({ driverId: driver.id });
      const startedShift = {
        ...mockShift,
        status: ShiftStatus.ACTIVE,
        actualStart: new Date(),
      };
      const mockResponse = createMockDriverShiftResponseDto(startedShift);
      startShiftSpy.mockResolvedValue(mockResponse);

      const result = await controller.startShift(mockShift.id, driver);

      expect(result.status).toBe(ShiftStatus.ACTIVE);
      expect(startShiftSpy).toHaveBeenCalledWith(mockShift.id, driver.id);
    });

    it('should throw ForbiddenException for non-owner driver', async () => {
      const driver = createMockDriver();
      startShiftSpy.mockRejectedValue(
        new ForbiddenException('You can only manage your own shifts'),
      );

      await expect(
        controller.startShift(generateUuid(), driver),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid status', async () => {
      const driver = createMockDriver();
      startShiftSpy.mockRejectedValue(
        new BadRequestException('Cannot start shift with status ACTIVE'),
      );

      await expect(
        controller.startShift(generateUuid(), driver),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('PATCH /driver-shifts/:id/end', () => {
    it('should end shift', async () => {
      const driver = createMockDriver();
      const mockShift = createActiveShift({ driverId: driver.id });
      const endedShift = {
        ...mockShift,
        status: ShiftStatus.COMPLETED,
        actualEnd: new Date(),
      };
      const mockResponse = createMockDriverShiftResponseDto(endedShift);
      endShiftSpy.mockResolvedValue(mockResponse);

      const result = await controller.endShift(mockShift.id, driver);

      expect(result.status).toBe(ShiftStatus.COMPLETED);
      expect(endShiftSpy).toHaveBeenCalledWith(mockShift.id, driver.id);
    });

    it('should throw ForbiddenException for non-owner driver', async () => {
      const driver = createMockDriver();
      endShiftSpy.mockRejectedValue(
        new ForbiddenException('You can only manage your own shifts'),
      );

      await expect(controller.endShift(generateUuid(), driver)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException for invalid status', async () => {
      const driver = createMockDriver();
      endShiftSpy.mockRejectedValue(
        new BadRequestException('Cannot end shift with status SCHEDULED'),
      );

      await expect(controller.endShift(generateUuid(), driver)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('PATCH /driver-shifts/:id/cancel', () => {
    it('should cancel shift', async () => {
      const mockShift = createScheduledShift();
      const cancelledShift = { ...mockShift, status: ShiftStatus.CANCELLED };
      const mockResponse = createMockDriverShiftResponseDto(cancelledShift);
      cancelShiftSpy.mockResolvedValue(mockResponse);

      const result = await controller.cancelShift(mockShift.id);

      expect(result.status).toBe(ShiftStatus.CANCELLED);
      expect(cancelShiftSpy).toHaveBeenCalledWith(mockShift.id);
    });

    it('should throw BadRequestException for completed shift', async () => {
      cancelShiftSpy.mockRejectedValue(
        new BadRequestException('Cannot cancel a completed shift'),
      );

      await expect(controller.cancelShift(generateUuid())).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('PATCH /driver-shifts/:id/absent', () => {
    it('should mark shift as absent', async () => {
      const mockShift = createScheduledShift();
      const absentShift = { ...mockShift, status: ShiftStatus.ABSENT };
      const mockResponse = createMockDriverShiftResponseDto(absentShift);
      markAbsentSpy.mockResolvedValue(mockResponse);

      const result = await controller.markAbsent(mockShift.id);

      expect(result.status).toBe(ShiftStatus.ABSENT);
      expect(markAbsentSpy).toHaveBeenCalledWith(mockShift.id);
    });

    it('should throw BadRequestException for non-scheduled shift', async () => {
      markAbsentSpy.mockRejectedValue(
        new BadRequestException(
          'Cannot mark absent a shift with status ACTIVE',
        ),
      );

      await expect(controller.markAbsent(generateUuid())).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('DELETE /driver-shifts/:id', () => {
    it('should delete shift', async () => {
      const mockShift = createScheduledShift();
      removeSpy.mockResolvedValue({
        message: 'Driver shift deleted successfully',
      });

      const result = await controller.remove(mockShift.id);

      expect(result.message).toBe('Driver shift deleted successfully');
      expect(removeSpy).toHaveBeenCalledWith(mockShift.id);
    });

    it('should throw BadRequestException for active shift', async () => {
      removeSpy.mockRejectedValue(
        new BadRequestException('Cannot delete an active shift'),
      );

      await expect(controller.remove(generateUuid())).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
