import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import {
  createMockUser,
  createMockDriver,
} from '../../test/factories/user.factory';
import { UserRole } from '../../common/enums';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let findByEmailSpy: jest.Mock;
  let signSpy: jest.Mock;

  const mockUser = createMockUser({
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedpassword',
    isActive: true,
  });

  beforeEach(async () => {
    findByEmailSpy = jest.fn();
    signSpy = jest.fn().mockReturnValue('jwt-token');

    const mockUsersService = {
      findByEmail: findByEmailSpy,
    };

    const mockJwtService = {
      sign: signSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password on valid credentials', async () => {
      findByEmailSpy.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('passwordHash');
      expect(findByEmailSpy).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null for non-existent user', async () => {
      findByEmailSpy.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should return null for incorrect password', async () => {
      findByEmailSpy.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return user and access token on successful login', async () => {
      findByEmailSpy.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.email).toBe('test@example.com');
      expect(signSpy).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      findByEmailSpy.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      findByEmailSpy.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should include correct role in JWT payload for admin user', async () => {
      const adminUser = createMockUser({
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      });
      findByEmailSpy.mockResolvedValue(adminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login({ email: 'admin@example.com', password: 'password' });

      expect(signSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.ADMIN,
        }),
      );
    });

    it('should include correct role in JWT payload for driver user', async () => {
      const driverUser = createMockDriver({ email: 'driver@example.com' });
      findByEmailSpy.mockResolvedValue(driverUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login({
        email: 'driver@example.com',
        password: 'password',
      });

      expect(signSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.DRIVER,
        }),
      );
    });
  });
});
