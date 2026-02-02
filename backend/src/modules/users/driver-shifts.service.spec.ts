import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DriverShiftsService } from './driver-shifts.service';
import { DriverShift } from './entities/driver-shift.entity';
import { User } from './entities/user.entity';
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
  createCompletedShift,
  createCancelledShift,
  createMockDriverShifts,
} from '../../test/factories/driver-shift.factory';
import { createMockDriver } from '../../test/factories/user.factory';
import { createMockQueryBuilder } from '../../test/mocks/repository.mock';
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

describe('DriverShiftsService', () => {
  let service: DriverShiftsService;
  let shiftFindOneSpy: jest.Mock;
  let shiftFindSpy: jest.Mock;
  let shiftCreateSpy: jest.Mock;
  let shiftSaveSpy: jest.Mock;
  let shiftRemoveSpy: jest.Mock;
  let userFindOneSpy: jest.Mock;
  let shiftQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

  beforeEach(async () => {
    shiftFindOneSpy = jest.fn();
    shiftFindSpy = jest.fn();
    shiftCreateSpy = jest.fn(<E>(entity: E): E => entity);
    shiftSaveSpy = jest.fn();
    shiftRemoveSpy = jest.fn();
    userFindOneSpy = jest.fn();
    shiftQueryBuilder = createMockQueryBuilder<DriverShift>();

    const mockShiftRepository = {
      findOne: shiftFindOneSpy,
      find: shiftFindSpy,
      create: shiftCreateSpy,
      save: shiftSaveSpy,
      remove: shiftRemoveSpy,
      createQueryBuilder: jest.fn().mockReturnValue(shiftQueryBuilder),
    };

    const mockUserRepository = {
      findOne: userFindOneSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverShiftsService,
        {
          provide: getRepositoryToken(DriverShift),
          useValue: mockShiftRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<DriverShiftsService>(DriverShiftsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateDriverShiftDto = {
      driverId: generateUuid(),
      shiftDate: formatDate(today()),
      startTime: formatTime(8, 0),
      endTime: formatTime(17, 0),
    };

    it('should create a driver shift successfully', async () => {
      const mockDriver = createMockDriver({ id: createDto.driverId });
      const mockShift = createMockDriverShift({
        driverId: createDto.driverId,
        startTime: createDto.startTime,
        endTime: createDto.endTime,
      });

      userFindOneSpy.mockResolvedValue(mockDriver);
      shiftFindOneSpy.mockResolvedValueOnce(null).mockResolvedValueOnce({
        ...mockShift,
        driver: mockDriver,
      });
      shiftCreateSpy.mockReturnValue(mockShift);
      shiftSaveSpy.mockResolvedValue(mockShift);

      const result = await service.create(createDto);

      expect(result.driverId).toBe(createDto.driverId);
      expect(shiftCreateSpy).toHaveBeenCalled();
      expect(shiftSaveSpy).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent driver', async () => {
      userFindOneSpy.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        `Active driver with ID ${createDto.driverId} not found`,
      );
    });

    it('should throw BadRequestException for invalid time range', async () => {
      const mockDriver = createMockDriver({ id: createDto.driverId });
      userFindOneSpy.mockResolvedValue(mockDriver);

      const invalidDto: CreateDriverShiftDto = {
        ...createDto,
        startTime: formatTime(17, 0),
        endTime: formatTime(8, 0),
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'End time must be after start time',
      );
    });

    it('should throw ConflictException for duplicate shift on same date', async () => {
      const mockDriver = createMockDriver({ id: createDto.driverId });
      const existingShift = createMockDriverShift({
        driverId: createDto.driverId,
      });

      userFindOneSpy.mockResolvedValue(mockDriver);
      shiftFindOneSpy.mockResolvedValue(existingShift);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Driver already has a shift scheduled for this date',
      );
    });
  });

  describe('findAll', () => {
    it('should return all shifts', async () => {
      const mockShifts = createMockDriverShifts(5);
      shiftQueryBuilder.getMany.mockResolvedValue(mockShifts);

      const filterDto: DriverShiftFilterDto = {};
      const result = await service.findAll(filterDto);

      expect(result).toHaveLength(5);
    });

    it('should filter shifts by driver ID', async () => {
      const driverId = generateUuid();
      const mockShifts = createMockDriverShifts(3, { driverId });
      shiftQueryBuilder.getMany.mockResolvedValue(mockShifts);

      const filterDto: DriverShiftFilterDto = { driverId };
      const result = await service.findAll(filterDto);

      expect(result).toHaveLength(3);
    });

    it('should filter shifts by date', async () => {
      const mockShifts = createMockDriverShifts(2);
      shiftQueryBuilder.getMany.mockResolvedValue(mockShifts);

      const filterDto: DriverShiftFilterDto = { date: formatDate(today()) };
      const result = await service.findAll(filterDto);

      expect(result).toHaveLength(2);
    });

    it('should filter shifts by date range', async () => {
      const mockShifts = createMockDriverShifts(4);
      shiftQueryBuilder.getMany.mockResolvedValue(mockShifts);

      const dateFrom = new Date();
      const dateTo = new Date();
      dateTo.setDate(dateTo.getDate() + 7);

      const filterDto: DriverShiftFilterDto = {
        dateFrom: formatDate(dateFrom),
        dateTo: formatDate(dateTo),
      };
      const result = await service.findAll(filterDto);

      expect(result).toHaveLength(4);
    });

    it('should filter shifts by status', async () => {
      const mockShifts = [createActiveShift(), createActiveShift()];
      shiftQueryBuilder.getMany.mockResolvedValue(mockShifts);

      const filterDto: DriverShiftFilterDto = { status: ShiftStatus.ACTIVE };
      const result = await service.findAll(filterDto);

      expect(result).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return shift by ID', async () => {
      const mockShift = createMockDriverShift();
      shiftFindOneSpy.mockResolvedValue(mockShift);

      const result = await service.findById(mockShift.id);

      expect(result.id).toBe(mockShift.id);
      expect(shiftFindOneSpy).toHaveBeenCalledWith({
        where: { id: mockShift.id },
        relations: ['driver', 'driver.department'],
      });
    });

    it('should throw NotFoundException for non-existent shift', async () => {
      const nonExistentId = generateUuid();
      shiftFindOneSpy.mockResolvedValue(null);

      await expect(service.findById(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById(nonExistentId)).rejects.toThrow(
        `Driver shift with ID ${nonExistentId} not found`,
      );
    });
  });

  describe('findByDriverId', () => {
    it('should return shifts by driver ID', async () => {
      const driverId = generateUuid();
      const mockShifts = createMockDriverShifts(3, { driverId });
      shiftFindSpy.mockResolvedValue(mockShifts);

      const result = await service.findByDriverId(driverId);

      expect(result).toHaveLength(3);
      expect(shiftFindSpy).toHaveBeenCalledWith({
        where: { driverId },
        relations: ['driver', 'driver.department'],
        order: { shiftDate: 'ASC', startTime: 'ASC' },
      });
    });
  });

  describe('findTodayShifts', () => {
    it("should return today's shifts", async () => {
      const mockShifts = createMockDriverShifts(4);
      shiftFindSpy.mockResolvedValue(mockShifts);

      const result = await service.findTodayShifts();

      expect(result).toHaveLength(4);
    });
  });

  describe('findAvailableDriversForTime', () => {
    it('should return available drivers for time', async () => {
      const mockShifts = createMockDriverShifts(2);
      shiftQueryBuilder.getMany.mockResolvedValue(mockShifts);

      const result = await service.findAvailableDriversForTime(
        formatDate(today()),
        formatTime(10, 0),
      );

      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update shift successfully', async () => {
      const mockShift = createScheduledShift();
      const updateDto: UpdateDriverShiftDto = { endTime: formatTime(18, 0) };
      const updatedShift = { ...mockShift, ...updateDto };

      shiftFindOneSpy
        .mockResolvedValueOnce(mockShift)
        .mockResolvedValueOnce({ ...updatedShift, driver: createMockDriver() });
      shiftSaveSpy.mockResolvedValue(updatedShift);

      const result = await service.update(mockShift.id, updateDto);

      expect(result.endTime).toBe(formatTime(18, 0));
    });

    it('should throw NotFoundException for non-existent shift', async () => {
      const nonExistentId = generateUuid();
      shiftFindOneSpy.mockResolvedValue(null);

      await expect(
        service.update(nonExistentId, { endTime: formatTime(18, 0) }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid time range on update', async () => {
      const mockShift = createScheduledShift({ startTime: formatTime(8, 0) });
      const updateDto: UpdateDriverShiftDto = { endTime: formatTime(7, 0) };

      shiftFindOneSpy.mockResolvedValue(mockShift);

      await expect(service.update(mockShift.id, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(mockShift.id, updateDto)).rejects.toThrow(
        'End time must be after start time',
      );
    });

    it('should throw NotFoundException when changing to non-existent driver', async () => {
      const mockShift = createScheduledShift();
      const newDriverId = generateUuid();
      const updateDto: UpdateDriverShiftDto = { driverId: newDriverId };

      shiftFindOneSpy.mockResolvedValue(mockShift);
      userFindOneSpy.mockResolvedValue(null);

      await expect(service.update(mockShift.id, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(mockShift.id, updateDto)).rejects.toThrow(
        `Active driver with ID ${newDriverId} not found`,
      );
    });
  });

  describe('startShift', () => {
    it('should start shift successfully', async () => {
      const driverId = generateUuid();
      const mockShift = createScheduledShift({ driverId });
      const startedShift = {
        ...mockShift,
        status: ShiftStatus.ACTIVE,
        actualStart: new Date(),
      };

      shiftFindOneSpy.mockResolvedValueOnce(mockShift).mockResolvedValueOnce({
        ...startedShift,
        driver: createMockDriver({ id: driverId }),
      });
      shiftSaveSpy.mockResolvedValue(startedShift);

      const result = await service.startShift(mockShift.id, driverId);

      expect(result.status).toBe(ShiftStatus.ACTIVE);
      expect(result.actualStart).toBeDefined();
    });

    it('should throw NotFoundException for non-existent shift', async () => {
      const nonExistentId = generateUuid();
      shiftFindOneSpy.mockResolvedValue(null);

      await expect(service.startShift(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for non-owner driver', async () => {
      const mockShift = createScheduledShift({ driverId: generateUuid() });
      const differentDriverId = generateUuid();

      shiftFindOneSpy.mockResolvedValue(mockShift);

      await expect(
        service.startShift(mockShift.id, differentDriverId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.startShift(mockShift.id, differentDriverId),
      ).rejects.toThrow('You can only manage your own shifts');
    });

    it('should throw BadRequestException for non-scheduled shift', async () => {
      const driverId = generateUuid();
      const mockShift = createActiveShift({ driverId });

      shiftFindOneSpy.mockResolvedValue(mockShift);

      await expect(service.startShift(mockShift.id, driverId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.startShift(mockShift.id, driverId)).rejects.toThrow(
        `Cannot start shift with status ${ShiftStatus.ACTIVE}`,
      );
    });
  });

  describe('endShift', () => {
    it('should end shift successfully', async () => {
      const driverId = generateUuid();
      const mockShift = createActiveShift({ driverId });
      const endedShift = {
        ...mockShift,
        status: ShiftStatus.COMPLETED,
        actualEnd: new Date(),
      };

      shiftFindOneSpy.mockResolvedValueOnce(mockShift).mockResolvedValueOnce({
        ...endedShift,
        driver: createMockDriver({ id: driverId }),
      });
      shiftSaveSpy.mockResolvedValue(endedShift);

      const result = await service.endShift(mockShift.id, driverId);

      expect(result.status).toBe(ShiftStatus.COMPLETED);
      expect(result.actualEnd).toBeDefined();
    });

    it('should throw ForbiddenException for non-owner driver', async () => {
      const mockShift = createActiveShift({ driverId: generateUuid() });
      const differentDriverId = generateUuid();

      shiftFindOneSpy.mockResolvedValue(mockShift);

      await expect(
        service.endShift(mockShift.id, differentDriverId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for non-active shift', async () => {
      const driverId = generateUuid();
      const mockShift = createScheduledShift({ driverId });

      shiftFindOneSpy.mockResolvedValue(mockShift);

      await expect(service.endShift(mockShift.id, driverId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.endShift(mockShift.id, driverId)).rejects.toThrow(
        `Cannot end shift with status ${ShiftStatus.SCHEDULED}`,
      );
    });
  });

  describe('cancelShift', () => {
    it('should cancel shift successfully', async () => {
      const mockShift = createScheduledShift();
      const cancelledShift = { ...mockShift, status: ShiftStatus.CANCELLED };

      shiftFindOneSpy.mockResolvedValueOnce(mockShift).mockResolvedValueOnce({
        ...cancelledShift,
        driver: createMockDriver(),
      });
      shiftSaveSpy.mockResolvedValue(cancelledShift);

      const result = await service.cancelShift(mockShift.id);

      expect(result.status).toBe(ShiftStatus.CANCELLED);
    });

    it('should throw NotFoundException for non-existent shift', async () => {
      const nonExistentId = generateUuid();
      shiftFindOneSpy.mockResolvedValue(null);

      await expect(service.cancelShift(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for completed shift', async () => {
      const mockShift = createCompletedShift();

      shiftFindOneSpy.mockResolvedValue(mockShift);

      await expect(service.cancelShift(mockShift.id)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancelShift(mockShift.id)).rejects.toThrow(
        'Cannot cancel a completed shift',
      );
    });
  });

  describe('markAbsent', () => {
    it('should mark shift as absent successfully', async () => {
      const mockShift = createScheduledShift();
      const absentShift = { ...mockShift, status: ShiftStatus.ABSENT };

      shiftFindOneSpy
        .mockResolvedValueOnce(mockShift)
        .mockResolvedValueOnce({ ...absentShift, driver: createMockDriver() });
      shiftSaveSpy.mockResolvedValue(absentShift);

      const result = await service.markAbsent(mockShift.id);

      expect(result.status).toBe(ShiftStatus.ABSENT);
    });

    it('should throw NotFoundException for non-existent shift', async () => {
      const nonExistentId = generateUuid();
      shiftFindOneSpy.mockResolvedValue(null);

      await expect(service.markAbsent(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for non-scheduled shift', async () => {
      const mockShift = createActiveShift();

      shiftFindOneSpy.mockResolvedValue(mockShift);

      await expect(service.markAbsent(mockShift.id)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.markAbsent(mockShift.id)).rejects.toThrow(
        `Cannot mark absent a shift with status ${ShiftStatus.ACTIVE}`,
      );
    });
  });

  describe('remove', () => {
    it('should delete shift successfully', async () => {
      const mockShift = createScheduledShift();

      shiftFindOneSpy.mockResolvedValue(mockShift);
      shiftRemoveSpy.mockResolvedValue(mockShift);

      const result = await service.remove(mockShift.id);

      expect(result.message).toBe('Driver shift deleted successfully');
      expect(shiftRemoveSpy).toHaveBeenCalledWith(mockShift);
    });

    it('should throw NotFoundException for non-existent shift', async () => {
      const nonExistentId = generateUuid();
      shiftFindOneSpy.mockResolvedValue(null);

      await expect(service.remove(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for active shift', async () => {
      const mockShift = createActiveShift();

      shiftFindOneSpy.mockResolvedValue(mockShift);

      await expect(service.remove(mockShift.id)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove(mockShift.id)).rejects.toThrow(
        'Cannot delete an active shift',
      );
    });

    it('should allow deleting cancelled shift', async () => {
      const mockShift = createCancelledShift();

      shiftFindOneSpy.mockResolvedValue(mockShift);
      shiftRemoveSpy.mockResolvedValue(mockShift);

      const result = await service.remove(mockShift.id);

      expect(result.message).toBe('Driver shift deleted successfully');
    });
  });
});
