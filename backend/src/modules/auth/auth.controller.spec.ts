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

  const createMockResponse = () => ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  });

  const createMockRequest = (user?: Record<string, unknown>) => ({
    user: user ?? mockLoginResponse.user,
  });

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

    it('should return user data and set httpOnly cookie on successful login', async () => {
      loginSpy.mockResolvedValue(mockLoginResponse);
      const mockRes = createMockResponse();

      const result = await controller.login(loginDto, mockRes as never);

      expect(result).toEqual({ user: mockLoginResponse.user });
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'accessToken',
        'jwt-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
        }),
      );
      expect(loginSpy).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      loginSpy.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );
      const mockRes = createMockResponse();

      await expect(controller.login(loginDto, mockRes as never)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(loginSpy).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      loginSpy.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );
      const mockRes = createMockResponse();

      const inactiveUserLogin: LoginDto = {
        email: 'inactive@example.com',
        password: 'password123',
      };

      await expect(
        controller.login(inactiveUserLogin, mockRes as never),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear the accessToken cookie and return success message', () => {
      const mockRes = createMockResponse();

      const result = controller.logout(mockRes as never);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'accessToken',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
        }),
      );
    });
  });

  describe('GET /auth/me', () => {
    it('should return the current user from request', () => {
      const mockReq = createMockRequest();

      const result = controller.getMe(mockReq as never);

      expect(result).toEqual({ user: mockLoginResponse.user });
    });
  });
});
