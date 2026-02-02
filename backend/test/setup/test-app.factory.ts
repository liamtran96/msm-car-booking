import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
  container: StartedPostgreSqlContainer,
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

      // JWT Module for generating test tokens
      JwtModule.register({
        secret: 'test-jwt-secret-key-for-testing',
        signOptions: { expiresIn: '1d' },
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
    }),
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
  modules: unknown[],
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
      ...(modules as []),
    ],
  });

  const module = await moduleBuilder.compile();
  const app = module.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  const dataSource = module.get(DataSource);
  const jwtService = module.get(JwtService);

  return { app, module, dataSource, jwtService };
}
