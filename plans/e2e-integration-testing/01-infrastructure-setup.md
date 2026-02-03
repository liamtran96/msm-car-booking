# Phase 1: Test Infrastructure Setup

**Document ID:** PLAN-20260202-E2E-TESTING-01
**Phase:** Infrastructure Setup
**Status:** Active
**Estimated Effort:** 4-6 hours

## Overview

This phase establishes the foundational test infrastructure including testcontainers for PostgreSQL, Jest configuration for E2E and integration tests, and shared utilities for test data management.

## Tasks

### Task 1.1: Install Dependencies

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/package.json`

Add the following devDependencies:

```bash
cd /Users/liam/Workspaces/msm-car-booking/backend
pnpm add -D @testcontainers/postgresql testcontainers socket.io-client
```

**Expected additions to package.json:**
```json
{
  "devDependencies": {
    "@testcontainers/postgresql": "^10.18.0",
    "testcontainers": "^10.18.0",
    "socket.io-client": "^4.8.3"
  }
}
```

---

### Task 1.2: Create Test Database Setup

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/setup/test-database.ts`

```typescript
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

let container: StartedPostgreSqlContainer | null = null;
let dataSource: DataSource | null = null;

/**
 * Starts a PostgreSQL container for testing
 * Uses singleton pattern to reuse container across tests
 */
export async function startTestDatabase(): Promise<StartedPostgreSqlContainer> {
  if (container) {
    return container;
  }

  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('msm_car_booking_test')
    .withUsername('test')
    .withPassword('test')
    .withExposedPorts(5432)
    .withReuse()
    .start();

  return container;
}

/**
 * Gets TypeORM DataSource options for test database
 */
export function getTestDataSourceOptions(
  container: StartedPostgreSqlContainer
): DataSourceOptions {
  return {
    type: 'postgres',
    host: container.getHost(),
    port: container.getMappedPort(5432),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
    entities: [join(__dirname, '../../src/**/*.entity{.ts,.js}')],
    synchronize: true, // Auto-create schema for tests
    logging: false,
    dropSchema: false, // Don't drop - we'll clean tables manually
  };
}

/**
 * Creates and initializes a TypeORM DataSource
 */
export async function createTestDataSource(
  container: StartedPostgreSqlContainer
): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  const options = getTestDataSourceOptions(container);
  dataSource = new DataSource(options);
  await dataSource.initialize();
  
  return dataSource;
}

/**
 * Cleans all data from tables while preserving schema
 */
export async function cleanDatabase(ds: DataSource): Promise<void> {
  const entities = ds.entityMetadatas;
  
  // Disable foreign key checks temporarily
  await ds.query('SET session_replication_role = replica;');
  
  for (const entity of entities) {
    const repository = ds.getRepository(entity.name);
    await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
  }
  
  // Re-enable foreign key checks
  await ds.query('SET session_replication_role = DEFAULT;');
}

/**
 * Stops the test database container
 */
export async function stopTestDatabase(): Promise<void> {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
    dataSource = null;
  }
  
  if (container) {
    await container.stop();
    container = null;
  }
}

/**
 * Gets environment variables for NestJS ConfigService
 */
export function getTestEnvConfig(container: StartedPostgreSqlContainer): Record<string, string> {
  return {
    DATABASE_HOST: container.getHost(),
    DATABASE_PORT: container.getMappedPort(5432).toString(),
    DATABASE_USERNAME: container.getUsername(),
    DATABASE_PASSWORD: container.getPassword(),
    DATABASE_NAME: container.getDatabase(),
    DATABASE_SYNCHRONIZE: 'true',
    DATABASE_LOGGING: 'false',
    JWT_SECRET: 'test-jwt-secret-key-for-testing',
    JWT_EXPIRES_IN: '1d',
    NODE_ENV: 'test',
  };
}
```

---

### Task 1.3: Create Jest Global Setup

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/setup/global-setup.ts`

```typescript
import { startTestDatabase, getTestEnvConfig } from './test-database';

export default async function globalSetup(): Promise<void> {
  console.log('\n🐳 Starting test database container...');
  
  const container = await startTestDatabase();
  
  // Store container connection info in environment for tests
  const envConfig = getTestEnvConfig(container);
  for (const [key, value] of Object.entries(envConfig)) {
    process.env[key] = value;
  }
  
  // Store container info for global teardown
  (globalThis as Record<string, unknown>).__TEST_CONTAINER__ = container;
  
  console.log(`✅ Test database ready at ${container.getHost()}:${container.getMappedPort(5432)}`);
}
```

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/setup/global-teardown.ts`

```typescript
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export default async function globalTeardown(): Promise<void> {
  console.log('\n🧹 Cleaning up test database...');
  
  const container = (globalThis as Record<string, unknown>).__TEST_CONTAINER__ as StartedPostgreSqlContainer;
  
  if (container) {
    // Don't stop if reuse is enabled - container will persist
    // await container.stop();
    console.log('✅ Test container cleanup complete (container reused for next run)');
  }
}
```

---

### Task 1.4: Create Test Application Factory

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/setup/test-app.factory.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { getTestDataSourceOptions } from './test-database';

// Import all modules
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { DepartmentsModule } from '../../src/modules/departments/departments.module';
import { VehiclesModule } from '../../src/modules/vehicles/vehicles.module';
import { BookingsModule } from '../../src/modules/bookings/bookings.module';
import { GpsModule } from '../../src/modules/gps/gps.module';
import { NotificationsModule } from '../../src/modules/notifications/notifications.module';
import { ApprovalsModule } from '../../src/modules/approvals/approvals.module';
import { ChatModule } from '../../src/modules/chat/chat.module';
import { LocationsModule } from '../../src/modules/locations/locations.module';
import { SystemModule } from '../../src/modules/system/system.module';

export interface TestAppContext {
  app: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
  jwtService: JwtService;
}

/**
 * Creates a fully configured NestJS application for E2E testing
 */
export async function createTestApp(
  container: StartedPostgreSqlContainer
): Promise<TestAppContext> {
  const dataSourceOptions = getTestDataSourceOptions(container);

  const moduleBuilder = Test.createTestingModule({
    imports: [
      // Configuration
      ConfigModule.forRoot({
        isGlobal: true,
        load: [
          () => ({
            database: {
              host: container.getHost(),
              port: container.getMappedPort(5432),
              username: container.getUsername(),
              password: container.getPassword(),
              name: container.getDatabase(),
              synchronize: true,
              logging: false,
            },
            app: {
              jwt: {
                secret: 'test-jwt-secret-key-for-testing',
                expiresIn: '1d',
              },
            },
          }),
        ],
      }),

      // Database
      TypeOrmModule.forRoot({
        ...dataSourceOptions,
        autoLoadEntities: true,
      }),

      // Feature modules
      AuthModule,
      UsersModule,
      DepartmentsModule,
      VehiclesModule,
      BookingsModule,
      GpsModule,
      NotificationsModule,
      ApprovalsModule,
      ChatModule,
      LocationsModule,
      SystemModule,
    ],
  });

  const module = await moduleBuilder.compile();
  const app = module.createNestApplication();

  // Apply same configuration as production app
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  await app.init();

  const dataSource = module.get(DataSource);
  const jwtService = module.get(JwtService);

  return { app, module, dataSource, jwtService };
}

/**
 * Creates a test app with specific modules only (for integration tests)
 */
export async function createTestAppWithModules(
  container: StartedPostgreSqlContainer,
  modules: any[]
): Promise<TestAppContext> {
  const dataSourceOptions = getTestDataSourceOptions(container);

  const moduleBuilder = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [
          () => ({
            database: {
              host: container.getHost(),
              port: container.getMappedPort(5432),
              username: container.getUsername(),
              password: container.getPassword(),
              name: container.getDatabase(),
              synchronize: true,
              logging: false,
            },
            app: {
              jwt: {
                secret: 'test-jwt-secret-key-for-testing',
                expiresIn: '1d',
              },
            },
          }),
        ],
      }),
      TypeOrmModule.forRoot({
        ...dataSourceOptions,
        autoLoadEntities: true,
      }),
      JwtModule.register({
        secret: 'test-jwt-secret-key-for-testing',
        signOptions: { expiresIn: '1d' },
      }),
      ...modules,
    ],
  });

  const module = await moduleBuilder.compile();
  const app = module.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  await app.init();

  const dataSource = module.get(DataSource);
  const jwtService = module.get(JwtService);

  return { app, module, dataSource, jwtService };
}
```

---

### Task 1.5: Create Database Seeder Utility

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/src/test/utils/database-seeder.ts`

```typescript
import { DataSource, Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Department } from '../../modules/departments/entities/department.entity';
import { Vehicle } from '../../modules/vehicles/entities/vehicle.entity';
import { Booking } from '../../modules/bookings/entities/booking.entity';
import {
  UserRole,
  UserSegment,
  PositionLevel,
  VehicleType,
  VehicleStatus,
  BookingType,
  BookingStatus,
  ApprovalType,
} from '../../common/enums';
import * as bcrypt from 'bcrypt';

export interface SeededData {
  departments: Department[];
  users: {
    admin: User;
    pic: User;
    ga: User;
    driver: User;
    employee: User;
    manager: User;
    sicEmployee: User;
  };
  vehicles: Vehicle[];
  bookings: Booking[];
}

/**
 * Seeds the database with test data
 */
export async function seedTestData(dataSource: DataSource): Promise<SeededData> {
  const departmentRepo = dataSource.getRepository(Department);
  const userRepo = dataSource.getRepository(User);
  const vehicleRepo = dataSource.getRepository(Vehicle);
  const bookingRepo = dataSource.getRepository(Booking);

  // Create departments
  const departments = await createDepartments(departmentRepo);

  // Create users
  const users = await createUsers(userRepo, departments[0]);

  // Create vehicles
  const vehicles = await createVehicles(vehicleRepo, users.driver);

  // Create sample bookings
  const bookings = await createBookings(
    bookingRepo,
    users.employee,
    departments[0],
    vehicles[0],
    users.driver
  );

  return { departments, users, vehicles, bookings };
}

async function createDepartments(repo: Repository<Department>): Promise<Department[]> {
  const departments = [
    { name: 'Engineering', code: 'ENG', costCenter: 'CC-001' },
    { name: 'Marketing', code: 'MKT', costCenter: 'CC-002' },
    { name: 'Operations', code: 'OPS', costCenter: 'CC-003' },
  ];

  const created: Department[] = [];
  for (const dept of departments) {
    const entity = repo.create({ ...dept, isActive: true });
    created.push(await repo.save(entity));
  }
  return created;
}

async function createUsers(
  repo: Repository<User>,
  department: Department
): Promise<SeededData['users']> {
  const passwordHash = await bcrypt.hash('Test123!@#', 10);

  // Create manager first (for managerId references)
  const manager = repo.create({
    email: 'manager@test.com',
    passwordHash,
    fullName: 'Test Manager',
    phone: '+84123456700',
    role: UserRole.EMPLOYEE,
    userSegment: UserSegment.SOMETIMES,
    positionLevel: PositionLevel.MGR,
    departmentId: department.id,
    isActive: true,
  });
  const savedManager = await repo.save(manager);

  const users: Partial<User>[] = [
    {
      email: 'admin@test.com',
      passwordHash,
      fullName: 'Test Admin',
      phone: '+84123456701',
      role: UserRole.ADMIN,
      userSegment: UserSegment.SOMETIMES,
      positionLevel: PositionLevel.C_LEVEL,
      departmentId: department.id,
      isActive: true,
    },
    {
      email: 'pic@test.com',
      passwordHash,
      fullName: 'Test PIC',
      phone: '+84123456702',
      role: UserRole.PIC,
      userSegment: UserSegment.SOMETIMES,
      positionLevel: PositionLevel.STAFF,
      departmentId: department.id,
      isActive: true,
    },
    {
      email: 'ga@test.com',
      passwordHash,
      fullName: 'Test GA',
      phone: '+84123456703',
      role: UserRole.GA,
      userSegment: UserSegment.SOMETIMES,
      positionLevel: PositionLevel.STAFF,
      departmentId: department.id,
      isActive: true,
    },
    {
      email: 'driver@test.com',
      passwordHash,
      fullName: 'Test Driver',
      phone: '+84123456704',
      role: UserRole.DRIVER,
      userSegment: UserSegment.DAILY,
      positionLevel: PositionLevel.STAFF,
      departmentId: department.id,
      isActive: true,
    },
    {
      email: 'employee@test.com',
      passwordHash,
      fullName: 'Test Employee',
      phone: '+84123456705',
      role: UserRole.EMPLOYEE,
      userSegment: UserSegment.SOMETIMES,
      positionLevel: PositionLevel.STAFF,
      managerId: savedManager.id,
      departmentId: department.id,
      isActive: true,
    },
    {
      email: 'sic.employee@test.com',
      passwordHash,
      fullName: 'SIC Employee',
      phone: '+84123456706',
      role: UserRole.EMPLOYEE,
      userSegment: UserSegment.DAILY, // SIC user
      positionLevel: PositionLevel.STAFF,
      managerId: savedManager.id,
      departmentId: department.id,
      isActive: true,
    },
  ];

  const [admin, pic, ga, driver, employee, sicEmployee] = await Promise.all(
    users.map(async (user) => {
      const entity = repo.create(user);
      return repo.save(entity);
    })
  );

  return {
    admin,
    pic,
    ga,
    driver,
    employee,
    manager: savedManager,
    sicEmployee,
  };
}

async function createVehicles(
  repo: Repository<Vehicle>,
  driver: User
): Promise<Vehicle[]> {
  const vehicles: Partial<Vehicle>[] = [
    {
      licensePlate: '51A-TEST1',
      brand: 'Toyota',
      model: 'Camry',
      year: 2023,
      capacity: 4,
      vehicleType: VehicleType.SEDAN,
      status: VehicleStatus.AVAILABLE,
      currentOdometerKm: 10000,
      gpsDeviceId: 'GPS-TEST-001',
      assignedDriverId: driver.id,
      isActive: true,
    },
    {
      licensePlate: '51A-TEST2',
      brand: 'Toyota',
      model: 'Fortuner',
      year: 2023,
      capacity: 7,
      vehicleType: VehicleType.SUV,
      status: VehicleStatus.AVAILABLE,
      currentOdometerKm: 15000,
      gpsDeviceId: 'GPS-TEST-002',
      isActive: true,
    },
    {
      licensePlate: '51A-TEST3',
      brand: 'Ford',
      model: 'Transit',
      year: 2022,
      capacity: 16,
      vehicleType: VehicleType.VAN,
      status: VehicleStatus.MAINTENANCE,
      currentOdometerKm: 50000,
      gpsDeviceId: 'GPS-TEST-003',
      isActive: true,
    },
  ];

  return Promise.all(
    vehicles.map(async (vehicle) => {
      const entity = repo.create(vehicle);
      return repo.save(entity);
    })
  );
}

async function createBookings(
  repo: Repository<Booking>,
  requester: User,
  department: Department,
  vehicle: Vehicle,
  driver: User
): Promise<Booking[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings: Partial<Booking>[] = [
    {
      bookingCode: 'MSM-20260202-0001',
      requesterId: requester.id,
      departmentId: department.id,
      bookingType: BookingType.SINGLE_TRIP,
      status: BookingStatus.PENDING,
      approvalType: ApprovalType.MANAGER_APPROVAL,
      isBusinessTrip: true,
      scheduledDate: today,
      scheduledTime: '09:00',
      purpose: 'Client meeting',
      passengerCount: 2,
      estimatedKm: 50,
    },
    {
      bookingCode: 'MSM-20260202-0002',
      requesterId: requester.id,
      departmentId: department.id,
      bookingType: BookingType.SINGLE_TRIP,
      status: BookingStatus.CONFIRMED,
      approvalType: ApprovalType.AUTO_APPROVED,
      isBusinessTrip: true,
      scheduledDate: today,
      scheduledTime: '14:00',
      purpose: 'Office visit',
      passengerCount: 1,
      estimatedKm: 30,
      assignedVehicleId: vehicle.id,
      assignedDriverId: driver.id,
    },
  ];

  return Promise.all(
    bookings.map(async (booking) => {
      const entity = repo.create(booking);
      return repo.save(entity);
    })
  );
}

/**
 * Cleans all seeded data from database
 */
export async function cleanTestData(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;
  
  await dataSource.query('SET session_replication_role = replica;');
  
  for (const entity of entities) {
    await dataSource.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
  }
  
  await dataSource.query('SET session_replication_role = DEFAULT;');
}
```

---

### Task 1.6: Create E2E Test Helper

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/src/test/utils/e2e-test-helper.ts`

```typescript
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
}

/**
 * Generates JWT tokens for all user roles
 */
export function generateTestTokens(
  jwtService: JwtService,
  users: Record<string, User>
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
  payload: { sub: string; email: string; role: UserRole }
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
```

---

### Task 1.7: Update Jest E2E Configuration

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/jest-e2e.json`

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "moduleNameMapper": {
    "^src/(.*)$": "<rootDir>/../src/$1"
  },
  "globalSetup": "<rootDir>/setup/global-setup.ts",
  "globalTeardown": "<rootDir>/setup/global-teardown.ts",
  "setupFilesAfterEnv": ["<rootDir>/setup/jest-setup.ts"],
  "testTimeout": 60000,
  "maxWorkers": 1,
  "verbose": true,
  "collectCoverage": false
}
```

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/setup/jest-setup.ts`

```typescript
import 'reflect-metadata';

// Increase timeout for database operations
jest.setTimeout(60000);

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
// };
```

---

### Task 1.8: Create Integration Test Configuration

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/jest-integration.json`

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".integration-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "moduleNameMapper": {
    "^src/(.*)$": "<rootDir>/../src/$1"
  },
  "globalSetup": "<rootDir>/setup/global-setup.ts",
  "globalTeardown": "<rootDir>/setup/global-teardown.ts",
  "setupFilesAfterEnv": ["<rootDir>/setup/jest-setup.ts"],
  "testTimeout": 120000,
  "maxWorkers": 1,
  "verbose": true,
  "collectCoverage": false
}
```

---

### Task 1.9: Update package.json Scripts

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/package.json`

Add the following scripts:

```json
{
  "scripts": {
    "test:e2e": "jest --config ./test/jest-e2e.json --runInBand",
    "test:e2e:watch": "jest --config ./test/jest-e2e.json --watch --runInBand",
    "test:e2e:cov": "jest --config ./test/jest-e2e.json --coverage --runInBand",
    "test:integration": "jest --config ./test/jest-integration.json --runInBand",
    "test:integration:watch": "jest --config ./test/jest-integration.json --watch --runInBand",
    "test:all": "pnpm test && pnpm test:integration && pnpm test:e2e"
  }
}
```

---

### Task 1.10: Create Directory Structure

```bash
# Create all necessary directories
mkdir -p /Users/liam/Workspaces/msm-car-booking/backend/test/setup
mkdir -p /Users/liam/Workspaces/msm-car-booking/backend/test/fixtures
mkdir -p /Users/liam/Workspaces/msm-car-booking/backend/test/e2e
mkdir -p /Users/liam/Workspaces/msm-car-booking/backend/test/integration
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Dependencies installed successfully (`pnpm install`)
- [ ] Test database starts with testcontainers
- [ ] TypeORM connects to test database
- [ ] Schema is created automatically
- [ ] Test data can be seeded and cleaned
- [ ] JWT tokens can be generated for test users
- [ ] All Jest configurations are valid
- [ ] Package.json scripts work correctly

## Test Verification Script

Run this to verify infrastructure setup:

```bash
cd /Users/liam/Workspaces/msm-car-booking/backend

# Verify testcontainers installation
node -e "require('@testcontainers/postgresql')"

# Run a quick test to verify container starts
cat > /tmp/test-container.ts << 'SCRIPT'
import { PostgreSqlContainer } from '@testcontainers/postgresql';

async function main() {
  console.log('Starting PostgreSQL container...');
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test')
    .start();
  console.log(`Container started at ${container.getHost()}:${container.getMappedPort(5432)}`);
  await container.stop();
  console.log('Container stopped successfully');
}

main().catch(console.error);
SCRIPT

npx ts-node /tmp/test-container.ts
```

## Next Steps

After completing infrastructure setup, proceed to:
- **02-e2e-tests.md** - Implement E2E tests for all modules

