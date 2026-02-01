# Core User Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement comprehensive user CRUD with role-based authorization, pagination, password management, and driver shifts tracking.

**Architecture:** NestJS module with guards, decorators, and DTOs for role-based access control. Users module handles CRUD + password management. Driver shifts as a separate controller within the users module. All responses exclude passwordHash via class-transformer.

**Tech Stack:** NestJS 10, TypeORM, PostgreSQL, class-validator, class-transformer, bcrypt, Passport JWT

---

## Current State

| File | Status | Notes |
|------|--------|-------|
| `backend/src/modules/users/entities/user.entity.ts` | Exists | Basic entity |
| `backend/src/modules/users/entities/driver-shift.entity.ts` | Exists | Not integrated |
| `backend/src/modules/users/users.service.ts` | Exists | Basic CRUD |
| `backend/src/modules/users/users.controller.ts` | Exists | No role protection |
| `backend/src/common/guards/jwt-auth.guard.ts` | Exists | Basic JWT |

---

## Phase 1: Common Infrastructure

### Task 1.1: Create Roles Decorator

**Files:**
- Create: `backend/src/common/decorators/roles.decorator.ts`

**Step 1: Create the decorator file**

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

**Step 2: Verify file exists**

Run: `ls backend/src/common/decorators/roles.decorator.ts`
Expected: File listed

---

### Task 1.2: Create Current User Decorator

**Files:**
- Create: `backend/src/common/decorators/current-user.decorator.ts`

**Step 1: Create the decorator file**

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../modules/users/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;
    return data ? user?.[data] : user;
  },
);
```

---

### Task 1.3: Create Decorators Index

**Files:**
- Create: `backend/src/common/decorators/index.ts`

**Step 1: Create index file**

```typescript
export * from './roles.decorator';
export * from './current-user.decorator';
```

---

### Task 1.4: Create Roles Guard

**Files:**
- Create: `backend/src/common/guards/roles.guard.ts`

**Step 1: Create the guard file**

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '../../modules/users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
```

---

### Task 1.5: Create Guards Index

**Files:**
- Create: `backend/src/common/guards/index.ts`

**Step 1: Create index file**

```typescript
export * from './jwt-auth.guard';
export * from './roles.guard';
```

---

### Task 1.6: Create HTTP Exception Filter

**Files:**
- Create: `backend/src/common/filters/http-exception.filter.ts`

**Step 1: Create the filter file**

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string | string[]) || exception.message;
        error = (responseObj.error as string) || exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
      message = 'An unexpected error occurred';
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
```

---

### Task 1.7: Create Filters Index

**Files:**
- Create: `backend/src/common/filters/index.ts`

**Step 1: Create index file**

```typescript
export * from './http-exception.filter';
```

---

### Task 1.8: Update main.ts with Global Filter

**Files:**
- Modify: `backend/src/main.ts`

**Step 1: Add import and useGlobalFilters**

Add after existing imports:
```typescript
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
```

Add in bootstrap function after `app.useGlobalPipes(...)`:
```typescript
app.useGlobalFilters(new HttpExceptionFilter());
```

**Step 2: Verify compilation**

Run: `cd backend && pnpm build`
Expected: Build succeeds

---

## Phase 2: Pagination Infrastructure

### Task 2.1: Create Pagination DTOs

**Files:**
- Create: `backend/src/common/dto/pagination.dto.ts`

**Step 1: Create the DTO file**

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}

export class PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMeta;

  constructor(data: T[], totalItems: number, page: number, limit: number) {
    this.data = data;
    const totalPages = Math.ceil(totalItems / limit);
    this.meta = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
```

---

### Task 2.2: Create Common DTO Index

**Files:**
- Create: `backend/src/common/dto/index.ts`

**Step 1: Create index file**

```typescript
export * from './pagination.dto';
```

---

### Task 2.3: Create Common Module Index

**Files:**
- Create: `backend/src/common/index.ts`

**Step 1: Create index file**

```typescript
export * from './decorators';
export * from './dto';
export * from './enums';
export * from './filters';
export * from './guards';
```

**Step 2: Verify compilation**

Run: `cd backend && pnpm build`
Expected: Build succeeds

---

## Phase 3: User Module Enhancements

### Task 3.1: Create User Response DTO

**Files:**
- Create: `backend/src/modules/users/dto/user-response.dto.ts`

**Step 1: Create the DTO file**

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { UserRole, UserSegment } from '../../../common/enums';

class DepartmentDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  code: string;
}

@Exclude()
export class UserResponseDto {
  @ApiProperty({ description: 'User UUID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User email address' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'User full name' })
  @Expose()
  fullName: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  @Expose()
  phone: string | null;

  @ApiProperty({ enum: UserRole, description: 'User role' })
  @Expose()
  role: UserRole;

  @ApiPropertyOptional({ enum: UserSegment, description: 'User segment' })
  @Expose()
  userSegment: UserSegment | null;

  @ApiPropertyOptional({ description: 'Department UUID' })
  @Expose()
  departmentId: string | null;

  @ApiPropertyOptional({ description: 'Department details', type: DepartmentDto })
  @Expose()
  @Type(() => DepartmentDto)
  department: DepartmentDto | null;

  @ApiProperty({ description: 'Whether user is active' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  // passwordHash excluded by @Exclude() class decorator
}
```

---

### Task 3.2: Create User Filter DTO

**Files:**
- Create: `backend/src/modules/users/dto/user-filter.dto.ts`

**Step 1: Create the DTO file**

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole, UserSegment } from '../../../common/enums';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class UserFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Filter by role' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserSegment, description: 'Filter by segment' })
  @IsEnum(UserSegment)
  @IsOptional()
  userSegment?: UserSegment;

  @ApiPropertyOptional({ description: 'Filter by department ID' })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

---

### Task 3.3: Create Change Password DTO

**Files:**
- Create: `backend/src/modules/users/dto/change-password.dto.ts`

**Step 1: Create the DTO file**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ description: 'New password (min 8 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  newPassword: string;

  @ApiProperty({ description: 'Confirm new password' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
```

---

### Task 3.4: Create Users DTO Index

**Files:**
- Create: `backend/src/modules/users/dto/index.ts`

**Step 1: Create index file**

```typescript
export * from './create-user.dto';
export * from './update-user.dto';
export * from './user-response.dto';
export * from './user-filter.dto';
export * from './change-password.dto';
```

---

### Task 3.5: Update Create User DTO

**Files:**
- Modify: `backend/src/modules/users/dto/create-user.dto.ts`

**Step 1: Add stronger password validation**

Replace the file content with:

```typescript
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserSegment } from '../../../common/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@msm.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: '+84901234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.EMPLOYEE })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiPropertyOptional({ enum: UserSegment, example: UserSegment.DAILY })
  @IsEnum(UserSegment)
  @IsOptional()
  userSegment?: UserSegment;

  @ApiPropertyOptional({ example: 'uuid-of-department' })
  @IsUUID()
  @IsOptional()
  departmentId?: string;
}
```

---

### Task 3.6: Replace Users Service

**Files:**
- Modify: `backend/src/modules/users/users.service.ts`

**Step 1: Replace with enhanced service**

```typescript
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { UserRole } from '../../common/enums';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private toResponseDto(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      passwordHash,
    });
    const savedUser = await this.userRepository.save(user);
    return this.toResponseDto(savedUser);
  }

  async findAll(
    filterDto: UserFilterDto,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { page = 1, limit = 10, search, role, userSegment, departmentId, isActive } = filterDto;

    const where: FindOptionsWhere<User> = {};

    if (role) where.role = role;
    if (userSegment) where.userSegment = userSegment;
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== undefined) where.isActive = isActive;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.department', 'department')
      .where(where);

    if (search) {
      queryBuilder.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const totalItems = await queryBuilder.getCount();
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit).orderBy('user.createdAt', 'DESC');

    const users = await queryBuilder.getMany();
    const responseDtos = users.map((user) => this.toResponseDto(user));

    return new PaginatedResponseDto(responseDtos, totalItems, page, limit);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['department'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.toResponseDto(user);
  }

  async findByIdInternal(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['department'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, isActive: true },
    });
  }

  async findDrivers(): Promise<UserResponseDto[]> {
    const drivers = await this.userRepository.find({
      where: { role: UserRole.DRIVER, isActive: true },
      relations: ['department'],
    });
    return drivers.map((driver) => this.toResponseDto(driver));
  }

  async findAvailableDrivers(): Promise<UserResponseDto[]> {
    const drivers = await this.userRepository.find({
      where: { role: UserRole.DRIVER, isActive: true },
      relations: ['department'],
    });
    return drivers.map((driver) => this.toResponseDto(driver));
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findByIdInternal(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);
    return this.toResponseDto(updatedUser);
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async resetPassword(id: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return { message: 'Password reset successfully' };
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findByIdInternal(id);
    user.isActive = false;
    await this.userRepository.save(user);
    return { message: 'User deactivated successfully' };
  }

  async restore(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['department'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    user.isActive = true;
    const restoredUser = await this.userRepository.save(user);
    return this.toResponseDto(restoredUser);
  }
}
```

---

### Task 3.7: Replace Users Controller

**Files:**
- Modify: `backend/src/modules/users/users.controller.ts`

**Step 1: Replace with enhanced controller**

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { User } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: 'Get all users with pagination (Admin, PIC)' })
  findAll(@Query() filterDto: UserFilterDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    return this.usersService.findAll(filterDto);
  }

  @Get('drivers')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: 'Get all drivers (Admin, PIC)' })
  findDrivers(): Promise<UserResponseDto[]> {
    return this.usersService.findDrivers();
  }

  @Get('drivers/available')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: 'Get available drivers (Admin, PIC)' })
  findAvailableDrivers(): Promise<UserResponseDto[]> {
    return this.usersService.findAvailableDrivers();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const { role, ...allowedUpdates } = updateUserDto;
    return this.usersService.update(user.id, allowedUpdates as UpdateUserDto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  async changeMyPassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.usersService.changePassword(user.id, changePasswordDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: 'Get user by ID (Admin, PIC)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user (Admin only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/password/reset')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password (Admin only)' })
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('newPassword') newPassword: string,
  ): Promise<{ message: string }> {
    return this.usersService.resetPassword(id, newPassword);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.usersService.remove(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Restore deactivated user (Admin only)' })
  restore(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.restore(id);
  }
}
```

**Step 2: Verify compilation**

Run: `cd backend && pnpm build`
Expected: Build succeeds

---

## Phase 4: Driver Shifts Management

### Task 4.1: Create Driver Shift DTOs

**Files:**
- Create: `backend/src/modules/users/dto/driver-shift.dto.ts`

**Step 1: Create the DTO file**

```typescript
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { ShiftStatus } from '../../../common/enums';
import { UserResponseDto } from './user-response.dto';

export class CreateDriverShiftDto {
  @ApiProperty({ description: 'Driver user ID' })
  @IsUUID()
  @IsNotEmpty()
  driverId: string;

  @ApiProperty({ description: 'Shift date (YYYY-MM-DD)', example: '2026-02-01' })
  @IsDateString()
  @IsNotEmpty()
  shiftDate: string;

  @ApiProperty({ description: 'Start time (HH:mm)', example: '08:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in HH:mm format',
  })
  startTime: string;

  @ApiProperty({ description: 'End time (HH:mm)', example: '17:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'End time must be in HH:mm format',
  })
  endTime: string;
}

export class UpdateDriverShiftDto extends PartialType(CreateDriverShiftDto) {
  @ApiPropertyOptional({ enum: ShiftStatus, description: 'Shift status' })
  @IsEnum(ShiftStatus)
  @IsOptional()
  status?: ShiftStatus;
}

export class DriverShiftFilterDto {
  @ApiPropertyOptional({ description: 'Filter by driver ID' })
  @IsUUID()
  @IsOptional()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Filter by date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'Filter by date from (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date to (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ enum: ShiftStatus, description: 'Filter by status' })
  @IsEnum(ShiftStatus)
  @IsOptional()
  status?: ShiftStatus;
}

export class DriverShiftResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  driverId: string;

  @ApiProperty()
  shiftDate: Date;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty({ enum: ShiftStatus })
  status: ShiftStatus;

  @ApiPropertyOptional()
  actualStart: Date | null;

  @ApiPropertyOptional()
  actualEnd: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => UserResponseDto })
  driver?: UserResponseDto;
}
```

---

### Task 4.2: Update DTO Index

**Files:**
- Modify: `backend/src/modules/users/dto/index.ts`

**Step 1: Add driver shift export**

```typescript
export * from './create-user.dto';
export * from './update-user.dto';
export * from './user-response.dto';
export * from './user-filter.dto';
export * from './change-password.dto';
export * from './driver-shift.dto';
```

---

### Task 4.3: Create Driver Shifts Service

**Files:**
- Create: `backend/src/modules/users/driver-shifts.service.ts`

**Step 1: Create the service file**

```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverShift } from './entities/driver-shift.entity';
import { User } from './entities/user.entity';
import {
  CreateDriverShiftDto,
  UpdateDriverShiftDto,
  DriverShiftFilterDto,
  DriverShiftResponseDto,
} from './dto/driver-shift.dto';
import { UserRole, ShiftStatus } from '../../common/enums';

@Injectable()
export class DriverShiftsService {
  constructor(
    @InjectRepository(DriverShift)
    private readonly shiftRepository: Repository<DriverShift>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private toResponseDto(shift: DriverShift): DriverShiftResponseDto {
    return {
      id: shift.id,
      driverId: shift.driverId,
      shiftDate: shift.shiftDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
      status: shift.status,
      actualStart: shift.actualStart,
      actualEnd: shift.actualEnd,
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt,
      driver: shift.driver
        ? {
            id: shift.driver.id,
            email: shift.driver.email,
            fullName: shift.driver.fullName,
            phone: shift.driver.phone,
            role: shift.driver.role,
            userSegment: shift.driver.userSegment,
            departmentId: shift.driver.departmentId,
            department: shift.driver.department,
            isActive: shift.driver.isActive,
            createdAt: shift.driver.createdAt,
            updatedAt: shift.driver.updatedAt,
          }
        : undefined,
    };
  }

  async create(createDto: CreateDriverShiftDto): Promise<DriverShiftResponseDto> {
    const driver = await this.userRepository.findOne({
      where: { id: createDto.driverId, role: UserRole.DRIVER, isActive: true },
    });
    if (!driver) {
      throw new NotFoundException(`Active driver with ID ${createDto.driverId} not found`);
    }

    if (createDto.startTime >= createDto.endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const existingShift = await this.shiftRepository.findOne({
      where: {
        driverId: createDto.driverId,
        shiftDate: new Date(createDto.shiftDate),
      },
    });
    if (existingShift) {
      throw new ConflictException('Driver already has a shift scheduled for this date');
    }

    const shift = this.shiftRepository.create({
      ...createDto,
      shiftDate: new Date(createDto.shiftDate),
    });

    const savedShift = await this.shiftRepository.save(shift);
    return this.findById(savedShift.id);
  }

  async findAll(filterDto: DriverShiftFilterDto): Promise<DriverShiftResponseDto[]> {
    const queryBuilder = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.driver', 'driver')
      .leftJoinAndSelect('driver.department', 'department');

    if (filterDto.driverId) {
      queryBuilder.andWhere('shift.driverId = :driverId', { driverId: filterDto.driverId });
    }

    if (filterDto.date) {
      queryBuilder.andWhere('shift.shiftDate = :date', { date: filterDto.date });
    }

    if (filterDto.dateFrom && filterDto.dateTo) {
      queryBuilder.andWhere('shift.shiftDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom: filterDto.dateFrom,
        dateTo: filterDto.dateTo,
      });
    } else if (filterDto.dateFrom) {
      queryBuilder.andWhere('shift.shiftDate >= :dateFrom', { dateFrom: filterDto.dateFrom });
    } else if (filterDto.dateTo) {
      queryBuilder.andWhere('shift.shiftDate <= :dateTo', { dateTo: filterDto.dateTo });
    }

    if (filterDto.status) {
      queryBuilder.andWhere('shift.status = :status', { status: filterDto.status });
    }

    queryBuilder.orderBy('shift.shiftDate', 'ASC').addOrderBy('shift.startTime', 'ASC');

    const shifts = await queryBuilder.getMany();
    return shifts.map((shift) => this.toResponseDto(shift));
  }

  async findById(id: string): Promise<DriverShiftResponseDto> {
    const shift = await this.shiftRepository.findOne({
      where: { id },
      relations: ['driver', 'driver.department'],
    });
    if (!shift) {
      throw new NotFoundException(`Driver shift with ID ${id} not found`);
    }
    return this.toResponseDto(shift);
  }

  async findByDriverId(driverId: string): Promise<DriverShiftResponseDto[]> {
    const shifts = await this.shiftRepository.find({
      where: { driverId },
      relations: ['driver', 'driver.department'],
      order: { shiftDate: 'ASC', startTime: 'ASC' },
    });
    return shifts.map((shift) => this.toResponseDto(shift));
  }

  async findTodayShifts(): Promise<DriverShiftResponseDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const shifts = await this.shiftRepository.find({
      where: { shiftDate: today },
      relations: ['driver', 'driver.department'],
      order: { startTime: 'ASC' },
    });
    return shifts.map((shift) => this.toResponseDto(shift));
  }

  async findAvailableDriversForTime(date: string, time: string): Promise<DriverShiftResponseDto[]> {
    const queryBuilder = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.driver', 'driver')
      .leftJoinAndSelect('driver.department', 'department')
      .where('shift.shiftDate = :date', { date })
      .andWhere('shift.startTime <= :time', { time })
      .andWhere('shift.endTime >= :time', { time })
      .andWhere('shift.status IN (:...statuses)', {
        statuses: [ShiftStatus.SCHEDULED, ShiftStatus.ACTIVE],
      })
      .andWhere('driver.isActive = :isActive', { isActive: true });

    const shifts = await queryBuilder.getMany();
    return shifts.map((shift) => this.toResponseDto(shift));
  }

  async update(id: string, updateDto: UpdateDriverShiftDto): Promise<DriverShiftResponseDto> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Driver shift with ID ${id} not found`);
    }

    const startTime = updateDto.startTime || shift.startTime;
    const endTime = updateDto.endTime || shift.endTime;
    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    if (updateDto.driverId && updateDto.driverId !== shift.driverId) {
      const driver = await this.userRepository.findOne({
        where: { id: updateDto.driverId, role: UserRole.DRIVER, isActive: true },
      });
      if (!driver) {
        throw new NotFoundException(`Active driver with ID ${updateDto.driverId} not found`);
      }
    }

    Object.assign(shift, {
      ...updateDto,
      shiftDate: updateDto.shiftDate ? new Date(updateDto.shiftDate) : shift.shiftDate,
    });

    await this.shiftRepository.save(shift);
    return this.findById(id);
  }

  async startShift(id: string): Promise<DriverShiftResponseDto> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Driver shift with ID ${id} not found`);
    }

    if (shift.status !== ShiftStatus.SCHEDULED) {
      throw new BadRequestException(`Cannot start shift with status ${shift.status}`);
    }

    shift.status = ShiftStatus.ACTIVE;
    shift.actualStart = new Date();

    await this.shiftRepository.save(shift);
    return this.findById(id);
  }

  async endShift(id: string): Promise<DriverShiftResponseDto> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Driver shift with ID ${id} not found`);
    }

    if (shift.status !== ShiftStatus.ACTIVE) {
      throw new BadRequestException(`Cannot end shift with status ${shift.status}`);
    }

    shift.status = ShiftStatus.COMPLETED;
    shift.actualEnd = new Date();

    await this.shiftRepository.save(shift);
    return this.findById(id);
  }

  async cancelShift(id: string): Promise<DriverShiftResponseDto> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Driver shift with ID ${id} not found`);
    }

    if (shift.status === ShiftStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed shift');
    }

    shift.status = ShiftStatus.CANCELLED;
    await this.shiftRepository.save(shift);
    return this.findById(id);
  }

  async markAbsent(id: string): Promise<DriverShiftResponseDto> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Driver shift with ID ${id} not found`);
    }

    if (shift.status !== ShiftStatus.SCHEDULED) {
      throw new BadRequestException(`Cannot mark absent a shift with status ${shift.status}`);
    }

    shift.status = ShiftStatus.ABSENT;
    await this.shiftRepository.save(shift);
    return this.findById(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const shift = await this.shiftRepository.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException(`Driver shift with ID ${id} not found`);
    }

    if (shift.status === ShiftStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete an active shift');
    }

    await this.shiftRepository.remove(shift);
    return { message: 'Driver shift deleted successfully' };
  }
}
```

---

### Task 4.4: Create Driver Shifts Controller

**Files:**
- Create: `backend/src/modules/users/driver-shifts.controller.ts`

**Step 1: Create the controller file**

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { DriverShiftsService } from './driver-shifts.service';
import {
  CreateDriverShiftDto,
  UpdateDriverShiftDto,
  DriverShiftFilterDto,
  DriverShiftResponseDto,
} from './dto/driver-shift.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { User } from './entities/user.entity';

@ApiTags('driver-shifts')
@Controller('driver-shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DriverShiftsController {
  constructor(private readonly driverShiftsService: DriverShiftsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: 'Create a driver shift (Admin, PIC)' })
  @ApiResponse({ status: 201, description: 'Shift created', type: DriverShiftResponseDto })
  create(@Body() createDto: CreateDriverShiftDto): Promise<DriverShiftResponseDto> {
    return this.driverShiftsService.create(createDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: 'Get all driver shifts with filters (Admin, PIC)' })
  findAll(@Query() filterDto: DriverShiftFilterDto): Promise<DriverShiftResponseDto[]> {
    return this.driverShiftsService.findAll(filterDto);
  }

  @Get('today')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: "Get today's shifts (Admin, PIC)" })
  findTodayShifts(): Promise<DriverShiftResponseDto[]> {
    return this.driverShiftsService.findTodayShifts();
  }

  @Get('available')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: 'Get available drivers for date/time (Admin, PIC)' })
  @ApiQuery({ name: 'date', required: true, description: 'Date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'time', required: true, description: 'Time (HH:mm)' })
  findAvailableDrivers(
    @Query('date') date: string,
    @Query('time') time: string,
  ): Promise<DriverShiftResponseDto[]> {
    return this.driverShiftsService.findAvailableDriversForTime(date, time);
  }

  @Get('my-shifts')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: "Get current driver's shifts (Driver only)" })
  findMyShifts(@CurrentUser() user: User): Promise<DriverShiftResponseDto[]> {
    return this.driverShiftsService.findByDriverId(user.id);
  }

  @Get('driver/:driverId')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: 'Get shifts by driver ID (Admin, PIC)' })
  findByDriverId(
    @Param('driverId', ParseUUIDPipe) driverId: string,
  ): Promise<DriverShiftResponseDto[]> {
    return this.driverShiftsService.findByDriverId(driverId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PIC, UserRole.DRIVER)
  @ApiOperation({ summary: 'Get shift by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DriverShiftResponseDto> {
    return this.driverShiftsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @ApiOperation({ summary: 'Update shift (Admin, PIC)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDriverShiftDto,
  ): Promise<DriverShiftResponseDto> {
    return this.driverShiftsService.update(id, updateDto);
  }

  @Patch(':id/start')
  @Roles(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start shift (Driver only)' })
  startShift(@Param('id', ParseUUIDPipe) id: string): Promise<DriverShiftResponseDto> {
    return this.driverShiftsService.startShift(id);
  }

  @Patch(':id/end')
  @Roles(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End shift (Driver only)' })
  endShift(@Param('id', ParseUUIDPipe) id: string): Promise<DriverShiftResponseDto> {
    return this.driverShiftsService.endShift(id);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel shift (Admin, PIC)' })
  cancelShift(@Param('id', ParseUUIDPipe) id: string): Promise<DriverShiftResponseDto> {
    return this.driverShiftsService.cancelShift(id);
  }

  @Patch(':id/absent')
  @Roles(UserRole.ADMIN, UserRole.PIC)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark shift as absent (Admin, PIC)' })
  markAbsent(@Param('id', ParseUUIDPipe) id: string): Promise<DriverShiftResponseDto> {
    return this.driverShiftsService.markAbsent(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete shift (Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.driverShiftsService.remove(id);
  }
}
```

---

### Task 4.5: Update Users Module

**Files:**
- Modify: `backend/src/modules/users/users.module.ts`

**Step 1: Add driver shifts service and controller**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DriverShiftsService } from './driver-shifts.service';
import { DriverShiftsController } from './driver-shifts.controller';
import { User } from './entities/user.entity';
import { DriverShift } from './entities/driver-shift.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, DriverShift])],
  controllers: [UsersController, DriverShiftsController],
  providers: [UsersService, DriverShiftsService],
  exports: [UsersService, DriverShiftsService, TypeOrmModule],
})
export class UsersModule {}
```

**Step 2: Verify compilation**

Run: `cd backend && pnpm build`
Expected: Build succeeds

---

## Phase 5: Verification

### Task 5.1: Run Full Build

**Step 1: Build the project**

Run: `cd backend && pnpm build`
Expected: Build completes without errors

### Task 5.2: Run Tests

**Step 1: Run unit tests**

Run: `cd backend && pnpm test`
Expected: All tests pass

### Task 5.3: Start Development Server

**Step 1: Start the server**

Run: `cd backend && pnpm start:dev`
Expected: Server starts without errors

---

## Permission Matrix

| Endpoint | ADMIN | PIC | GA | DRIVER | EMPLOYEE |
|----------|-------|-----|----|---------|---------|
| POST /users | Y | - | - | - | - |
| GET /users | Y | Y | - | - | - |
| GET /users/me | Y | Y | Y | Y | Y |
| PATCH /users/me | Y | Y | Y | Y | Y |
| PATCH /users/me/password | Y | Y | Y | Y | Y |
| GET /users/:id | Y | Y | - | - | - |
| PATCH /users/:id | Y | - | - | - | - |
| DELETE /users/:id | Y | - | - | - | - |
| PATCH /users/:id/restore | Y | - | - | - | - |
| PATCH /users/:id/password/reset | Y | - | - | - | - |
| GET /users/drivers | Y | Y | - | - | - |
| GET /users/drivers/available | Y | Y | - | - | - |
| POST /driver-shifts | Y | Y | - | - | - |
| GET /driver-shifts | Y | Y | - | - | - |
| GET /driver-shifts/today | Y | Y | - | - | - |
| GET /driver-shifts/available | Y | Y | - | - | - |
| GET /driver-shifts/my-shifts | - | - | - | Y | - |
| GET /driver-shifts/:id | Y | Y | - | Y | - |
| PATCH /driver-shifts/:id | Y | Y | - | - | - |
| PATCH /driver-shifts/:id/start | - | - | - | Y | - |
| PATCH /driver-shifts/:id/end | - | - | - | Y | - |
| PATCH /driver-shifts/:id/cancel | Y | Y | - | - | - |
| PATCH /driver-shifts/:id/absent | Y | Y | - | - | - |
| DELETE /driver-shifts/:id | Y | - | - | - | - |

---

## File Structure

```
backend/src/
├── common/
│   ├── decorators/
│   │   ├── index.ts                    [NEW]
│   │   ├── roles.decorator.ts          [NEW]
│   │   └── current-user.decorator.ts   [NEW]
│   ├── dto/
│   │   ├── index.ts                    [NEW]
│   │   └── pagination.dto.ts           [NEW]
│   ├── filters/
│   │   ├── index.ts                    [NEW]
│   │   └── http-exception.filter.ts    [NEW]
│   ├── guards/
│   │   ├── index.ts                    [NEW]
│   │   ├── jwt-auth.guard.ts           [EXISTS]
│   │   └── roles.guard.ts              [NEW]
│   ├── enums/
│   │   └── index.ts                    [EXISTS]
│   └── index.ts                        [NEW]
├── modules/
│   └── users/
│       ├── dto/
│       │   ├── index.ts                [NEW]
│       │   ├── create-user.dto.ts      [UPDATE]
│       │   ├── update-user.dto.ts      [EXISTS]
│       │   ├── user-response.dto.ts    [NEW]
│       │   ├── user-filter.dto.ts      [NEW]
│       │   ├── change-password.dto.ts  [NEW]
│       │   └── driver-shift.dto.ts     [NEW]
│       ├── entities/
│       │   ├── user.entity.ts          [EXISTS]
│       │   └── driver-shift.entity.ts  [EXISTS]
│       ├── users.module.ts             [UPDATE]
│       ├── users.service.ts            [UPDATE]
│       ├── users.controller.ts         [UPDATE]
│       ├── driver-shifts.service.ts    [NEW]
│       └── driver-shifts.controller.ts [NEW]
└── main.ts                             [UPDATE]
```
