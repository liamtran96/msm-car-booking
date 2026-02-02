import { Test, TestingModule } from '@nestjs/testing';
import { GpsController } from './gps.controller';
import { GpsService } from './gps.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  createGpsLocationHistory,
  createLatestPositions,
} from '../../test/factories/gps-location.factory';
import { generateUuid } from '../../test/utils/test-helper';

describe('GpsController', () => {
  let controller: GpsController;
  let getLatestPositionsSpy: jest.Mock;
  let getVehicleHistorySpy: jest.Mock;

  beforeEach(async () => {
    getLatestPositionsSpy = jest.fn();
    getVehicleHistorySpy = jest.fn();

    const mockService = {
      getLatestPositions: getLatestPositionsSpy,
      getVehicleHistory: getVehicleHistorySpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GpsController],
      providers: [
        {
          provide: GpsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<GpsController>(GpsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /gps/positions', () => {
    it('should return latest positions for all vehicles', async () => {
      const vehicleIds = [generateUuid(), generateUuid(), generateUuid()];
      const mockPositions = createLatestPositions(vehicleIds);
      getLatestPositionsSpy.mockResolvedValue(mockPositions);

      const result = await controller.getLatestPositions();

      expect(result).toHaveLength(3);
      expect(getLatestPositionsSpy).toHaveBeenCalled();
    });

    it('should return empty array when no positions', async () => {
      getLatestPositionsSpy.mockResolvedValue([]);

      const result = await controller.getLatestPositions();

      expect(result).toHaveLength(0);
    });
  });

  describe('GET /gps/vehicle/:vehicleId/history', () => {
    it('should return vehicle GPS history with default hours', async () => {
      const vehicleId = generateUuid();
      const mockHistory = createGpsLocationHistory(vehicleId, 10, 5);
      getVehicleHistorySpy.mockResolvedValue(mockHistory);

      const result = await controller.getVehicleHistory(vehicleId);

      expect(result).toHaveLength(10);
      expect(getVehicleHistorySpy).toHaveBeenCalledWith(vehicleId, 1);
    });

    it('should return vehicle GPS history with custom hours', async () => {
      const vehicleId = generateUuid();
      const mockHistory = createGpsLocationHistory(vehicleId, 20, 5);
      getVehicleHistorySpy.mockResolvedValue(mockHistory);

      const result = await controller.getVehicleHistory(vehicleId, 2);

      expect(result).toHaveLength(20);
      expect(getVehicleHistorySpy).toHaveBeenCalledWith(vehicleId, 2);
    });

    it('should return empty array for vehicle with no history', async () => {
      const vehicleId = generateUuid();
      getVehicleHistorySpy.mockResolvedValue([]);

      const result = await controller.getVehicleHistory(vehicleId);

      expect(result).toHaveLength(0);
    });
  });
});
