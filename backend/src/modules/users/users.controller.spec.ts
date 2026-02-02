import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRole, UserSegment } from '../../common/enums';
import {
  createMockUser,
  createMockUsers,
  createMockDrivers,
  createMockUserResponseDto,
} from '../../test/factories/user.factory';
import { generateUuid } from '../../test/utils/test-helper';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let createSpy: jest.Mock;
  let findAllSpy: jest.Mock;
  let findByIdSpy: jest.Mock;
  let findDriversSpy: jest.Mock;
  let findAvailableDriversSpy: jest.Mock;
  let updateSpy: jest.Mock;
  let changePasswordSpy: jest.Mock;
  let resetPasswordSpy: jest.Mock;
  let removeSpy: jest.Mock;
  let restoreSpy: jest.Mock;

  beforeEach(async () => {
    createSpy = jest.fn();
    findAllSpy = jest.fn();
    findByIdSpy = jest.fn();
    findDriversSpy = jest.fn();
    findAvailableDriversSpy = jest.fn();
    updateSpy = jest.fn();
    changePasswordSpy = jest.fn();
    resetPasswordSpy = jest.fn();
    removeSpy = jest.fn();
    restoreSpy = jest.fn();

    const mockUsersService = {
      create: createSpy,
      findAll: findAllSpy,
      findById: findByIdSpy,
      findDrivers: findDriversSpy,
      findAvailableDrivers: findAvailableDriversSpy,
      update: updateSpy,
      changePassword: changePasswordSpy,
      resetPassword: resetPasswordSpy,
      remove: removeSpy,
      restore: restoreSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /users', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'password123',
      fullName: 'New User',
      phone: '+84123456789',
      role: UserRole.EMPLOYEE,
      userSegment: UserSegment.SOMETIMES,
      departmentId: generateUuid(),
    };

    it('should create a new user', async () => {
      const mockUser = createMockUser({ email: createUserDto.email });
      const mockResponse = createMockUserResponseDto(mockUser);
      createSpy.mockResolvedValue(mockResponse);

      const result = await controller.create(createUserDto);

      expect(result.email).toBe(createUserDto.email);
      expect(createSpy).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw ConflictException for duplicate email', async () => {
      createSpy.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(controller.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('GET /users', () => {
    it('should return paginated users', async () => {
      const mockUsers = createMockUsers(10);
      const mockResponses = mockUsers.map(createMockUserResponseDto);
      const paginatedResponse = new PaginatedResponseDto(
        mockResponses,
        10,
        1,
        10,
      );
      findAllSpy.mockResolvedValue(paginatedResponse);

      const filterDto: UserFilterDto = { page: 1, limit: 10 };
      const result = await controller.findAll(filterDto);

      expect(result.data).toHaveLength(10);
      expect(result.meta.totalItems).toBe(10);
      expect(findAllSpy).toHaveBeenCalledWith(filterDto);
    });

    it('should filter users by role', async () => {
      const mockDrivers = createMockDrivers(5);
      const mockResponses = mockDrivers.map(createMockUserResponseDto);
      const paginatedResponse = new PaginatedResponseDto(
        mockResponses,
        5,
        1,
        10,
      );
      findAllSpy.mockResolvedValue(paginatedResponse);

      const filterDto: UserFilterDto = { role: UserRole.DRIVER };
      const result = await controller.findAll(filterDto);

      expect(result.data).toHaveLength(5);
      expect(findAllSpy).toHaveBeenCalledWith(filterDto);
    });

    it('should filter users by search term', async () => {
      const mockUsers = createMockUsers(3);
      const mockResponses = mockUsers.map(createMockUserResponseDto);
      const paginatedResponse = new PaginatedResponseDto(
        mockResponses,
        3,
        1,
        10,
      );
      findAllSpy.mockResolvedValue(paginatedResponse);

      const filterDto: UserFilterDto = { search: 'John' };
      const result = await controller.findAll(filterDto);

      expect(result.data).toHaveLength(3);
    });
  });

  describe('GET /users/drivers', () => {
    it('should return all drivers', async () => {
      const mockDrivers = createMockDrivers(5);
      const mockResponses = mockDrivers.map(createMockUserResponseDto);
      findDriversSpy.mockResolvedValue(mockResponses);

      const result = await controller.findDrivers();

      expect(result).toHaveLength(5);
      expect(findDriversSpy).toHaveBeenCalled();
    });
  });

  describe('GET /users/drivers/available', () => {
    it('should return available drivers', async () => {
      const mockDrivers = createMockDrivers(3);
      const mockResponses = mockDrivers.map(createMockUserResponseDto);
      findAvailableDriversSpy.mockResolvedValue(mockResponses);

      const result = await controller.findAvailableDrivers();

      expect(result).toHaveLength(3);
      expect(findAvailableDriversSpy).toHaveBeenCalled();
    });
  });

  describe('GET /users/me', () => {
    it('should return current user profile', async () => {
      const currentUser = createMockUser();
      const mockResponse = createMockUserResponseDto(currentUser);
      findByIdSpy.mockResolvedValue(mockResponse);

      const result = await controller.getMe(currentUser);

      expect(result.id).toBe(currentUser.id);
      expect(findByIdSpy).toHaveBeenCalledWith(currentUser.id);
    });
  });

  describe('PATCH /users/me', () => {
    it('should update current user profile', async () => {
      const currentUser = createMockUser();
      const updateDto: UpdateUserDto = { fullName: 'Updated Name' };
      const updatedUser = { ...currentUser, ...updateDto };
      const mockResponse = createMockUserResponseDto(updatedUser);
      updateSpy.mockResolvedValue(mockResponse);

      const result = await controller.updateMe(currentUser, updateDto);

      expect(result.fullName).toBe('Updated Name');
      expect(updateSpy).toHaveBeenCalledWith(currentUser.id, updateDto);
    });

    it('should not allow role change in self-update', async () => {
      const currentUser = createMockUser({ role: UserRole.EMPLOYEE });
      const updateDto: UpdateUserDto = {
        fullName: 'Updated Name',
        role: UserRole.ADMIN,
      };
      const updatedUser = { ...currentUser, fullName: 'Updated Name' };
      const mockResponse = createMockUserResponseDto(updatedUser);
      updateSpy.mockResolvedValue(mockResponse);

      await controller.updateMe(currentUser, updateDto);

      expect(updateSpy).toHaveBeenCalledWith(
        currentUser.id,
        expect.objectContaining({ fullName: 'Updated Name' }),
      );
      expect(updateSpy).toHaveBeenCalledWith(
        currentUser.id,
        expect.not.objectContaining({ role: UserRole.ADMIN }),
      );
    });
  });

  describe('PATCH /users/me/password', () => {
    it('should change current user password', async () => {
      const currentUser = createMockUser();
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };
      changePasswordSpy.mockResolvedValue({
        message: 'Password changed successfully',
      });

      const result = await controller.changeMyPassword(
        currentUser,
        changePasswordDto,
      );

      expect(result.message).toBe('Password changed successfully');
      expect(changePasswordSpy).toHaveBeenCalledWith(
        currentUser.id,
        changePasswordDto,
      );
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by ID', async () => {
      const mockUser = createMockUser();
      const mockResponse = createMockUserResponseDto(mockUser);
      findByIdSpy.mockResolvedValue(mockResponse);

      const result = await controller.findOne(mockUser.id);

      expect(result.id).toBe(mockUser.id);
      expect(findByIdSpy).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const nonExistentId = generateUuid();
      findByIdSpy.mockRejectedValue(
        new NotFoundException(`User with ID ${nonExistentId} not found`),
      );

      await expect(controller.findOne(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user', async () => {
      const mockUser = createMockUser();
      const updateDto: UpdateUserDto = { fullName: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updateDto };
      const mockResponse = createMockUserResponseDto(updatedUser);
      updateSpy.mockResolvedValue(mockResponse);

      const result = await controller.update(mockUser.id, updateDto);

      expect(result.fullName).toBe('Updated Name');
      expect(updateSpy).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('should throw ConflictException for duplicate email on update', async () => {
      const mockUser = createMockUser();
      const updateDto: UpdateUserDto = { email: 'existing@example.com' };
      updateSpy.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(controller.update(mockUser.id, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('PATCH /users/:id/password/reset', () => {
    it('should reset user password', async () => {
      const mockUser = createMockUser();
      const resetPasswordDto: ResetPasswordDto = {
        newPassword: 'newpassword123',
      };
      resetPasswordSpy.mockResolvedValue({
        message: 'Password reset successfully',
      });

      const result = await controller.resetPassword(
        mockUser.id,
        resetPasswordDto,
      );

      expect(result.message).toBe('Password reset successfully');
      expect(resetPasswordSpy).toHaveBeenCalledWith(
        mockUser.id,
        resetPasswordDto.newPassword,
      );
    });
  });

  describe('DELETE /users/:id', () => {
    it('should deactivate user', async () => {
      const mockUser = createMockUser();
      removeSpy.mockResolvedValue({
        message: 'User deactivated successfully',
      });

      const result = await controller.remove(mockUser.id);

      expect(result.message).toBe('User deactivated successfully');
      expect(removeSpy).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const nonExistentId = generateUuid();
      removeSpy.mockRejectedValue(
        new NotFoundException(`User with ID ${nonExistentId} not found`),
      );

      await expect(controller.remove(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PATCH /users/:id/restore', () => {
    it('should restore deactivated user', async () => {
      const mockUser = createMockUser({ isActive: false });
      const restoredUser = { ...mockUser, isActive: true };
      const mockResponse = createMockUserResponseDto(restoredUser);
      restoreSpy.mockResolvedValue(mockResponse);

      const result = await controller.restore(mockUser.id);

      expect(result.isActive).toBe(true);
      expect(restoreSpy).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const nonExistentId = generateUuid();
      restoreSpy.mockRejectedValue(
        new NotFoundException(`User with ID ${nonExistentId} not found`),
      );

      await expect(controller.restore(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
