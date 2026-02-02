import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  createMockVehicle,
  createAvailableVehicle,
  createMockVehicles,
} from '../../test/factories/vehicle.factory';
import { generateUuid } from '../../test/utils/test-helper';
import { NotFoundException } from '@nestjs/common';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let findAllSpy: jest.Mock;
  let findAvailableSpy: jest.Mock;
  let findByIdSpy: jest.Mock;

  beforeEach(async () => {
    findAllSpy = jest.fn();
    findAvailableSpy = jest.fn();
    findByIdSpy = jest.fn();

    const mockService = {
      findAll: findAllSpy,
      findAvailable: findAvailableSpy,
      findById: findByIdSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VehiclesController>(VehiclesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /vehicles', () => {
    it('should return all active vehicles', async () => {
      const mockVehicles = createMockVehicles(10);
      findAllSpy.mockResolvedValue(mockVehicles);

      const result = await controller.findAll();

      expect(result).toHaveLength(10);
      expect(findAllSpy).toHaveBeenCalled();
    });

    it('should return empty array when no vehicles', async () => {
      findAllSpy.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('GET /vehicles/available', () => {
    it('should return only available vehicles', async () => {
      const availableVehicles = [
        createAvailableVehicle(),
        createAvailableVehicle(),
      ];
      findAvailableSpy.mockResolvedValue(availableVehicles);

      const result = await controller.findAvailable();

      expect(result).toHaveLength(2);
      expect(findAvailableSpy).toHaveBeenCalled();
    });

    it('should return empty array when no available vehicles', async () => {
      findAvailableSpy.mockResolvedValue([]);

      const result = await controller.findAvailable();

      expect(result).toHaveLength(0);
    });
  });

  describe('GET /vehicles/:id', () => {
    it('should return vehicle by ID', async () => {
      const mockVehicle = createMockVehicle();
      findByIdSpy.mockResolvedValue(mockVehicle);

      const result = await controller.findOne(mockVehicle.id);

      expect(result.id).toBe(mockVehicle.id);
      expect(findByIdSpy).toHaveBeenCalledWith(mockVehicle.id);
    });

    it('should throw NotFoundException for non-existent vehicle', async () => {
      const nonExistentId = generateUuid();
      findByIdSpy.mockRejectedValue(
        new NotFoundException(`Vehicle with ID ${nonExistentId} not found`),
      );

      await expect(controller.findOne(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
