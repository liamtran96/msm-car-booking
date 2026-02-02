import { JwtService } from '@nestjs/jwt';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../common/enums';

export interface TestTokens {
  adminToken: string;
  picToken: string;
  gaToken: string;
  driverToken: string;
  employeeToken: string;
  managerToken: string;
  sicEmployeeToken: string;
}

/**
 * Generates JWT tokens for all user roles
 */
export function generateTestTokens(
  jwtService: JwtService,
  users: Record<string, User>,
): TestTokens {
  const generateToken = (user: User): string => {
    return jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  };

  return {
    adminToken: generateToken(users.admin),
    picToken: generateToken(users.pic),
    gaToken: generateToken(users.ga),
    driverToken: generateToken(users.driver),
    employeeToken: generateToken(users.employee),
    managerToken: generateToken(users.manager),
    sicEmployeeToken: generateToken(users.sicEmployee),
  };
}

/**
 * Creates authorization header for supertest requests
 */
export function authHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Creates a custom JWT token for specific test scenarios
 */
export function createCustomToken(
  jwtService: JwtService,
  payload: { sub: string; email: string; role: UserRole },
): string {
  return jwtService.sign(payload);
}

/**
 * Waits for a specified amount of time (for async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates unique test email
 */
export function uniqueEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
}

/**
 * Generates unique booking code
 */
export function uniqueBookingCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MSM-${date}-${suffix}`;
}

/**
 * Generates unique license plate
 */
export function uniqueLicensePlate(): string {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `51A-${suffix}`;
}
