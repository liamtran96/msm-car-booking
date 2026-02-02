import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DepartmentsService } from './departments.service';
import { Department } from './entities/department.entity';
import {
  createMockDepartment,
  createMockDepartments,
  createInactiveDepartment,
} from '../../test/factories/department.factory';
import { createMockRepository } from '../../test/mocks/repository.mock';
import { generateUuid } from '../../test/utils/test-helper';
import { NotFoundException } from '@nestjs/common';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let findSpy: jest.Mock;
  let findOneSpy: jest.Mock;

  beforeEach(async () => {
    findSpy = jest.fn();
    findOneSpy = jest.fn();

    const mockRepository = {
      ...createMockRepository<Department>(),
      find: findSpy,
      findOne: findOneSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        {
          provide: getRepositoryToken(Department),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all active departments', async () => {
      const mockDepartments = createMockDepartments(5);
      findSpy.mockResolvedValue(mockDepartments);

      const result = await service.findAll();

      expect(result).toHaveLength(5);
      expect(findSpy).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });

    it('should return empty array when no departments', async () => {
      findSpy.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });

    it('should only return active departments', async () => {
      const activeDepartments = createMockDepartments(3);
      findSpy.mockResolvedValue(activeDepartments);

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      expect(result.every((dept) => dept.isActive)).toBe(true);
    });
  });

  describe('findById', () => {
    it('should return department by ID', async () => {
      const mockDepartment = createMockDepartment();
      findOneSpy.mockResolvedValue(mockDepartment);

      const result = await service.findById(mockDepartment.id);

      expect(result.id).toBe(mockDepartment.id);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: mockDepartment.id },
      });
    });

    it('should throw NotFoundException for non-existent department', async () => {
      const nonExistentId = generateUuid();
      findOneSpy.mockResolvedValue(null);

      await expect(service.findById(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById(nonExistentId)).rejects.toThrow(
        `Department with ID ${nonExistentId} not found`,
      );
    });

    it('should return inactive department by ID', async () => {
      const inactiveDepartment = createInactiveDepartment();
      findOneSpy.mockResolvedValue(inactiveDepartment);

      const result = await service.findById(inactiveDepartment.id);

      expect(result.isActive).toBe(false);
    });
  });
});
