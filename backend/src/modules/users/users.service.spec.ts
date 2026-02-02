import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserRole, UserSegment } from '../../common/enums';
import {
  createMockUser,
  createMockUsers,
  createMockDrivers,
} from '../../test/factories/user.factory';
import { createMockQueryBuilder } from '../../test/mocks/repository.mock';
import { generateUuid } from '../../test/utils/test-helper';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let findOneSpy: jest.Mock;
  let findSpy: jest.Mock;
  let createSpy: jest.Mock;
  let saveSpy: jest.Mock;
  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

  beforeEach(async () => {
    findOneSpy = jest.fn();
    findSpy = jest.fn();
    createSpy = jest.fn(<E>(entity: E): E => entity);
    saveSpy = jest.fn();
    mockQueryBuilder = createMockQueryBuilder<User>();

    const mockRepository = {
      findOne: findOneSpy,
      find: findSpy,
      create: createSpy,
      save: saveSpy,
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'password123',
      fullName: 'New User',
      phone: '+84123456789',
      role: UserRole.EMPLOYEE,
      userSegment: UserSegment.SOMETIMES,
      departmentId: generateUuid(),
    };

    it('should create a new user successfully', async () => {
      const mockUser = createMockUser({ email: createUserDto.email });
      findOneSpy.mockResolvedValue(null);
      createSpy.mockReturnValue(mockUser);
      saveSpy.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result.email).toBe(createUserDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(createSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate email', async () => {
      const existingUser = createMockUser({ email: createUserDto.email });
      findOneSpy.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'Email already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = createMockUsers(10);
      mockQueryBuilder.getCount.mockResolvedValue(10);
      mockQueryBuilder.getMany.mockResolvedValue(mockUsers);

      const filterDto: UserFilterDto = { page: 1, limit: 10 };
      const result = await service.findAll(filterDto);

      expect(result.data).toHaveLength(10);
      expect(result.meta.totalItems).toBe(10);
    });

    it('should filter users by role', async () => {
      const mockDrivers = createMockDrivers(5);
      mockQueryBuilder.getCount.mockResolvedValue(5);
      mockQueryBuilder.getMany.mockResolvedValue(mockDrivers);

      const filterDto: UserFilterDto = { role: UserRole.DRIVER };
      const result = await service.findAll(filterDto);

      expect(result.data).toHaveLength(5);
    });

    it('should filter users by search term', async () => {
      const mockUsers = createMockUsers(3);
      mockQueryBuilder.getCount.mockResolvedValue(3);
      mockQueryBuilder.getMany.mockResolvedValue(mockUsers);

      const filterDto: UserFilterDto = { search: 'John' };
      const result = await service.findAll(filterDto);

      expect(result.data).toHaveLength(3);
    });

    it('should filter users by isActive', async () => {
      const activeUsers = createMockUsers(5);
      mockQueryBuilder.getCount.mockResolvedValue(5);
      mockQueryBuilder.getMany.mockResolvedValue(activeUsers);

      const filterDto: UserFilterDto = { isActive: true };
      const result = await service.findAll(filterDto);

      expect(result.data).toHaveLength(5);
    });
  });

  describe('findById', () => {
    it('should return user by ID', async () => {
      const mockUser = createMockUser();
      findOneSpy.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(result.id).toBe(mockUser.id);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        relations: ['department'],
      });
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const nonExistentId = generateUuid();
      findOneSpy.mockResolvedValue(null);

      await expect(service.findById(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById(nonExistentId)).rejects.toThrow(
        `User with ID ${nonExistentId} not found`,
      );
    });
  });

  describe('findByIdInternal', () => {
    it('should return full user entity', async () => {
      const mockUser = createMockUser();
      findOneSpy.mockResolvedValue(mockUser);

      const result = await service.findByIdInternal(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(result).toHaveProperty('passwordHash');
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = createMockUser({ email: 'test@example.com' });
      findOneSpy.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result?.email).toBe('test@example.com');
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: 'test@example.com', isActive: true },
      });
    });

    it('should return null for non-existent email', async () => {
      findOneSpy.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findDrivers', () => {
    it('should return all active drivers', async () => {
      const mockDrivers = createMockDrivers(5);
      findSpy.mockResolvedValue(mockDrivers);

      const result = await service.findDrivers();

      expect(result).toHaveLength(5);
      expect(findSpy).toHaveBeenCalledWith({
        where: { role: UserRole.DRIVER, isActive: true },
        relations: ['department'],
      });
    });
  });

  describe('findAvailableDrivers', () => {
    it('should return available drivers', async () => {
      const mockDrivers = createMockDrivers(3);
      findSpy.mockResolvedValue(mockDrivers);

      const result = await service.findAvailableDrivers();

      expect(result).toHaveLength(3);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const mockUser = createMockUser();
      const updateDto: UpdateUserDto = { fullName: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updateDto };

      findOneSpy
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);
      saveSpy.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateDto);

      expect(result.fullName).toBe('Updated Name');
    });

    it('should throw ConflictException for duplicate email on update', async () => {
      const mockUser = createMockUser({ email: 'original@example.com' });
      const existingUser = createMockUser({ email: 'existing@example.com' });
      const updateDto: UpdateUserDto = { email: 'existing@example.com' };

      findOneSpy
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(existingUser);

      await expect(service.update(mockUser.id, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const nonExistentId = generateUuid();
      findOneSpy.mockResolvedValue(null);

      await expect(
        service.update(nonExistentId, { fullName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123',
    };

    it('should change password successfully', async () => {
      const mockUser = createMockUser();
      findOneSpy.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      saveSpy.mockResolvedValue(mockUser);

      const result = await service.changePassword(
        mockUser.id,
        changePasswordDto,
      );

      expect(result.message).toBe('Password changed successfully');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should throw BadRequestException for password mismatch', async () => {
      const mockUser = createMockUser();
      const invalidDto: ChangePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword',
      };

      await expect(
        service.changePassword(mockUser.id, invalidDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword(mockUser.id, invalidDto),
      ).rejects.toThrow('New password and confirmation do not match');
    });

    it('should throw BadRequestException for incorrect current password', async () => {
      const mockUser = createMockUser();
      findOneSpy.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(mockUser.id, changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword(mockUser.id, changePasswordDto),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw BadRequestException when new password same as current', async () => {
      const mockUser = createMockUser();
      const samePasswordDto: ChangePasswordDto = {
        currentPassword: 'password123',
        newPassword: 'password123',
        confirmPassword: 'password123',
      };
      findOneSpy.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.changePassword(mockUser.id, samePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword(mockUser.id, samePasswordDto),
      ).rejects.toThrow('New password must be different from current password');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const nonExistentId = generateUuid();
      findOneSpy.mockResolvedValue(null);

      await expect(
        service.changePassword(nonExistentId, changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const mockUser = createMockUser();
      findOneSpy.mockResolvedValue(mockUser);
      saveSpy.mockResolvedValue(mockUser);

      const result = await service.resetPassword(mockUser.id, 'newpassword123');

      expect(result.message).toBe('Password reset successfully');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const nonExistentId = generateUuid();
      findOneSpy.mockResolvedValue(null);

      await expect(
        service.resetPassword(nonExistentId, 'newpassword'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should deactivate user successfully', async () => {
      const mockUser = createMockUser({ isActive: true });
      findOneSpy.mockResolvedValue(mockUser);
      saveSpy.mockResolvedValue({ ...mockUser, isActive: false });

      const result = await service.remove(mockUser.id);

      expect(result.message).toBe('User deactivated successfully');
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const nonExistentId = generateUuid();
      findOneSpy.mockResolvedValue(null);

      await expect(service.remove(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('should restore user successfully', async () => {
      const mockUser = createMockUser({ isActive: false });
      const restoredUser = { ...mockUser, isActive: true };
      findOneSpy.mockResolvedValue(mockUser);
      saveSpy.mockResolvedValue(restoredUser);

      const result = await service.restore(mockUser.id);

      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const nonExistentId = generateUuid();
      findOneSpy.mockResolvedValue(null);

      await expect(service.restore(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
