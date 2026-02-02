import { User } from '../../modules/users/entities/user.entity';
import { UserRole, UserSegment } from '../../common/enums';
import { generateUuid } from '../utils/test-helper';
import { UserResponseDto } from '../../modules/users/dto/user-response.dto';
import { Department } from '../../modules/departments/entities/department.entity';

export interface CreateUserOptions {
  id?: string;
  email?: string;
  passwordHash?: string;
  fullName?: string;
  phone?: string;
  role?: UserRole;
  userSegment?: UserSegment;
  departmentId?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a mock User entity
 */
export function createMockUser(options: CreateUserOptions = {}): User {
  const now = new Date();
  return {
    id: options.id ?? generateUuid(),
    email: options.email ?? `user-${Date.now()}@example.com`,
    passwordHash: options.passwordHash ?? '$2b$10$hashedpassword',
    fullName: options.fullName ?? 'Test User',
    phone: options.phone ?? '+84123456789',
    role: options.role ?? UserRole.EMPLOYEE,
    userSegment: options.userSegment ?? UserSegment.SOMETIMES,
    departmentId: options.departmentId ?? generateUuid(),
    department: undefined as unknown as Department,
    isActive: options.isActive ?? true,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Creates a mock Admin user
 */
export function createMockAdmin(options: CreateUserOptions = {}): User {
  return createMockUser({
    ...options,
    role: UserRole.ADMIN,
    fullName: options.fullName ?? 'Admin User',
  });
}

/**
 * Creates a mock PIC user
 */
export function createMockPic(options: CreateUserOptions = {}): User {
  return createMockUser({
    ...options,
    role: UserRole.PIC,
    fullName: options.fullName ?? 'PIC User',
  });
}

/**
 * Creates a mock Driver user
 */
export function createMockDriver(options: CreateUserOptions = {}): User {
  return createMockUser({
    ...options,
    role: UserRole.DRIVER,
    fullName: options.fullName ?? 'Driver User',
    userSegment: UserSegment.DAILY,
  });
}

/**
 * Creates a mock Employee user
 */
export function createMockEmployee(options: CreateUserOptions = {}): User {
  return createMockUser({
    ...options,
    role: UserRole.EMPLOYEE,
    fullName: options.fullName ?? 'Employee User',
  });
}

/**
 * Creates a mock GA user
 */
export function createMockGa(options: CreateUserOptions = {}): User {
  return createMockUser({
    ...options,
    role: UserRole.GA,
    fullName: options.fullName ?? 'GA User',
  });
}

/**
 * Creates a mock UserResponseDto
 */
export function createMockUserResponseDto(user: User): UserResponseDto {
  const dto = new UserResponseDto();
  dto.id = user.id;
  dto.email = user.email;
  dto.fullName = user.fullName;
  dto.phone = user.phone;
  dto.role = user.role;
  dto.userSegment = user.userSegment;
  dto.departmentId = user.departmentId;
  dto.isActive = user.isActive;
  dto.createdAt = user.createdAt;
  dto.updatedAt = user.updatedAt;
  return dto;
}

/**
 * Creates multiple mock users
 */
export function createMockUsers(
  count: number,
  options: CreateUserOptions = {},
): User[] {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({
      ...options,
      email: options.email ?? `user-${i + 1}@example.com`,
      fullName: options.fullName ?? `Test User ${i + 1}`,
    }),
  );
}

/**
 * Creates multiple mock drivers
 */
export function createMockDrivers(
  count: number,
  options: CreateUserOptions = {},
): User[] {
  return Array.from({ length: count }, (_, i) =>
    createMockDriver({
      ...options,
      email: options.email ?? `driver-${i + 1}@example.com`,
      fullName: options.fullName ?? `Driver ${i + 1}`,
    }),
  );
}
