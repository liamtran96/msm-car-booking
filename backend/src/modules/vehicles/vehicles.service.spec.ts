import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleStatus } from '../../common/enums';
import {
  createMockVehicle,
  createAvailableVehicle,
  createInUseVehicle,
  createMockVehicles,
} from '../../test/factories/vehicle.factory';
import { generateUuid } from '../../test/utils/test-helper';
import { NotFoundException } from '@nestjs/common';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let findSpy: jest.Mock;
  let findOneSpy: jest.Mock;
  let saveSpy: jest.Mock;

  beforeEach(async () => {
    findSpy = jest.fn();
    findOneSpy = jest.fn();
    saveSpy = jest.fn();

    const mockRepository = {
      find: findSpy,
      findOne: findOneSpy,
      save: saveSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all active vehicles', async () => {
      const mockVehicles = createMockVehicles(10);
      findSpy.mockResolvedValue(mockVehicles);

      const result = await service.findAll();

      expect(result).toHaveLength(10);
      expect(findSpy).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['assignedDriver'],
      });
    });

    it('should return empty array when no vehicles', async () => {
      findSpy.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findAvailable', () => {
    it('should return only available vehicles', async () => {
      const availableVehicles = [
        createAvailableVehicle(),
        createAvailableVehicle(),
      ];
      findSpy.mockResolvedValue(availableVehicles);

      const result = await service.findAvailable();

      expect(result).toHaveLength(2);
      expect(findSpy).toHaveBeenCalledWith({
        where: { isActive: true, status: VehicleStatus.AVAILABLE },
        relations: ['assignedDriver'],
      });
    });

    it('should not return in-use vehicles', async () => {
      findSpy.mockResolvedValue([]);

      const result = await service.findAvailable();

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return vehicle by ID', async () => {
      const mockVehicle = createMockVehicle();
      findOneSpy.mockResolvedValue(mockVehicle);

      const result = await service.findById(mockVehicle.id);

      expect(result.id).toBe(mockVehicle.id);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: mockVehicle.id },
        relations: ['assignedDriver'],
      });
    });

    it('should throw NotFoundException for non-existent vehicle', async () => {
      const nonExistentId = generateUuid();
      findOneSpy.mockResolvedValue(null);

      await expect(service.findById(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById(nonExistentId)).rejects.toThrow(
        `Vehicle with ID ${nonExistentId} not found`,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update vehicle status to IN_USE', async () => {
      const mockVehicle = createAvailableVehicle();
      const updatedVehicle = { ...mockVehicle, status: VehicleStatus.IN_USE };

      findOneSpy.mockResolvedValue(mockVehicle);
      saveSpy.mockResolvedValue(updatedVehicle);

      const result = await service.updateStatus(
        mockVehicle.id,
        VehicleStatus.IN_USE,
      );

      expect(result.status).toBe(VehicleStatus.IN_USE);
    });

    it('should update vehicle status to MAINTENANCE', async () => {
      const mockVehicle = createAvailableVehicle();
      const updatedVehicle = {
        ...mockVehicle,
        status: VehicleStatus.MAINTENANCE,
      };

      findOneSpy.mockResolvedValue(mockVehicle);
      saveSpy.mockResolvedValue(updatedVehicle);

      const result = await service.updateStatus(
        mockVehicle.id,
        VehicleStatus.MAINTENANCE,
      );

      expect(result.status).toBe(VehicleStatus.MAINTENANCE);
    });

    it('should update vehicle status to AVAILABLE', async () => {
      const mockVehicle = createInUseVehicle();
      const updatedVehicle = {
        ...mockVehicle,
        status: VehicleStatus.AVAILABLE,
      };

      findOneSpy.mockResolvedValue(mockVehicle);
      saveSpy.mockResolvedValue(updatedVehicle);

      const result = await service.updateStatus(
        mockVehicle.id,
        VehicleStatus.AVAILABLE,
      );

      expect(result.status).toBe(VehicleStatus.AVAILABLE);
    });

    it('should throw NotFoundException for non-existent vehicle', async () => {
      const nonExistentId = generateUuid();
      findOneSpy.mockResolvedValue(null);

      await expect(
        service.updateStatus(nonExistentId, VehicleStatus.IN_USE),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
