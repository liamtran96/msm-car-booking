import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GpsService } from './gps.service';
import { GpsLocation } from './entities/gps-location.entity';
import {
  createMockGpsLocation,
  createGpsLocationHistory,
  createLatestPositions,
  createMovingGpsLocation,
} from '../../test/factories/gps-location.factory';
import { createMockRepository } from '../../test/mocks/repository.mock';
import { generateUuid } from '../../test/utils/test-helper';

describe('GpsService', () => {
  let service: GpsService;
  let createQueryBuilderSpy: jest.Mock;
  let createSpy: jest.Mock;
  let saveSpy: jest.Mock;
  let mockQueryBuilder: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      distinctOn: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getMany: jest.fn().mockResolvedValue([]),
    };

    createQueryBuilderSpy = jest.fn().mockReturnValue(mockQueryBuilder);
    createSpy = jest.fn();
    saveSpy = jest.fn();

    const mockRepository = {
      ...createMockRepository<GpsLocation>(),
      createQueryBuilder: createQueryBuilderSpy,
      create: createSpy,
      save: saveSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GpsService,
        {
          provide: getRepositoryToken(GpsLocation),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GpsService>(GpsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLatestPositions', () => {
    it('should return latest position for each vehicle', async () => {
      const vehicleIds = [generateUuid(), generateUuid(), generateUuid()];
      const mockPositions = createLatestPositions(vehicleIds);
      mockQueryBuilder.getMany.mockResolvedValue(mockPositions);

      const result = await service.getLatestPositions();

      expect(result).toHaveLength(3);
    });

    it('should return empty array when no positions', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getLatestPositions();

      expect(result).toHaveLength(0);
    });
  });

  describe('getVehicleHistory', () => {
    it('should return GPS history for vehicle', async () => {
      const vehicleId = generateUuid();
      const mockHistory = createGpsLocationHistory(vehicleId, 10, 5);
      mockQueryBuilder.getMany.mockResolvedValue(mockHistory);

      const result = await service.getVehicleHistory(vehicleId, 1);

      expect(result).toHaveLength(10);
    });

    it('should return history for specified hours', async () => {
      const vehicleId = generateUuid();
      const mockHistory = createGpsLocationHistory(vehicleId, 20, 5);
      mockQueryBuilder.getMany.mockResolvedValue(mockHistory);

      const result = await service.getVehicleHistory(vehicleId, 2);

      expect(result).toHaveLength(20);
    });

    it('should return empty array for vehicle with no history', async () => {
      const vehicleId = generateUuid();
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getVehicleHistory(vehicleId);

      expect(result).toHaveLength(0);
    });

    it('should use default hours when not specified', async () => {
      const vehicleId = generateUuid();
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.getVehicleHistory(vehicleId);

      // Default is 1 hour
      expect(createQueryBuilderSpy).toHaveBeenCalled();
    });
  });

  describe('recordPosition', () => {
    it('should record GPS position successfully', async () => {
      const vehicleId = generateUuid();
      const positionData = {
        vehicleId,
        latitude: 10.762622,
        longitude: 106.660172,
        speedKmh: 45,
        heading: 90,
      };
      const mockLocation = createMovingGpsLocation({
        ...positionData,
      });

      createSpy.mockReturnValue(mockLocation);
      saveSpy.mockResolvedValue(mockLocation);

      const result = await service.recordPosition(positionData);

      expect(result.vehicleId).toBe(vehicleId);
      expect(result.latitude).toBe(10.762622);
      expect(result.longitude).toBe(106.660172);
      expect(createSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should record position without optional fields', async () => {
      const vehicleId = generateUuid();
      const positionData = {
        vehicleId,
        latitude: 10.762622,
        longitude: 106.660172,
      };
      const mockLocation = createMockGpsLocation({
        ...positionData,
        speedKmh: 0,
        heading: 0,
      });

      createSpy.mockReturnValue(mockLocation);
      saveSpy.mockResolvedValue(mockLocation);

      const result = await service.recordPosition(positionData);

      expect(result.vehicleId).toBe(vehicleId);
      expect(saveSpy).toHaveBeenCalled();
    });
  });
});
