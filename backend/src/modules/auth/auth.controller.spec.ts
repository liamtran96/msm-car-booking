import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';
import { createMockUser } from '../../test/factories/user.factory';

describe('AuthController', () => {
  let controller: AuthController;
  let loginSpy: jest.Mock;

  const mockUser = createMockUser({ email: 'test@example.com' });
  const mockLoginResponse = {
    user: {
      id: mockUser.id,
      email: mockUser.email,
      fullName: mockUser.fullName,
      phone: mockUser.phone,
      role: mockUser.role,
      userSegment: mockUser.userSegment,
      departmentId: mockUser.departmentId,
      department: mockUser.department,
      isActive: mockUser.isActive,
      createdAt: mockUser.createdAt,
      updatedAt: mockUser.updatedAt,
    },
    accessToken: 'jwt-token',
  };

  beforeEach(async () => {
    loginSpy = jest.fn();

    const mockAuthService = {
      login: loginSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return user and access token on successful login', async () => {
      loginSpy.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockLoginResponse);
      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(loginSpy).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      loginSpy.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(loginSpy).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      loginSpy.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      const inactiveUserLogin: LoginDto = {
        email: 'inactive@example.com',
        password: 'password123',
      };

      await expect(controller.login(inactiveUserLogin)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
