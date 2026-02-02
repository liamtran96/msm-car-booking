import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  createMockDepartment,
  createMockDepartments,
} from '../../test/factories/department.factory';
import { generateUuid } from '../../test/utils/test-helper';
import { NotFoundException } from '@nestjs/common';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  let findAllSpy: jest.Mock;
  let findByIdSpy: jest.Mock;

  beforeEach(async () => {
    findAllSpy = jest.fn();
    findByIdSpy = jest.fn();

    const mockService = {
      findAll: findAllSpy,
      findById: findByIdSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [
        {
          provide: DepartmentsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DepartmentsController>(DepartmentsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /departments', () => {
    it('should return all departments', async () => {
      const mockDepartments = createMockDepartments(5);
      findAllSpy.mockResolvedValue(mockDepartments);

      const result = await controller.findAll();

      expect(result).toHaveLength(5);
      expect(findAllSpy).toHaveBeenCalled();
    });

    it('should return empty array when no departments', async () => {
      findAllSpy.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('GET /departments/:id', () => {
    it('should return department by ID', async () => {
      const mockDepartment = createMockDepartment();
      findByIdSpy.mockResolvedValue(mockDepartment);

      const result = await controller.findOne(mockDepartment.id);

      expect(result.id).toBe(mockDepartment.id);
      expect(findByIdSpy).toHaveBeenCalledWith(mockDepartment.id);
    });

    it('should throw NotFoundException for non-existent department', async () => {
      const nonExistentId = generateUuid();
      findByIdSpy.mockRejectedValue(
        new NotFoundException(`Department with ID ${nonExistentId} not found`),
      );

      await expect(controller.findOne(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
