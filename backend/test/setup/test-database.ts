import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
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
  testContainer: StartedPostgreSqlContainer,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: testContainer.getHost(),
    port: testContainer.getMappedPort(5432),
    username: testContainer.getUsername(),
    password: testContainer.getPassword(),
    database: testContainer.getDatabase(),
    entities: [join(__dirname, '../../src/**/*.entity{.ts,.js}')],
    synchronize: true,
    logging: false,
    dropSchema: false,
  };
}

/**
 * Creates and initializes a TypeORM DataSource
 */
export async function createTestDataSource(
  testContainer: StartedPostgreSqlContainer,
): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  const options = getTestDataSourceOptions(testContainer);
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
    await ds.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
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
export function getTestEnvConfig(
  testContainer: StartedPostgreSqlContainer,
): Record<string, string> {
  return {
    DATABASE_HOST: testContainer.getHost(),
    DATABASE_PORT: testContainer.getMappedPort(5432).toString(),
    DATABASE_USERNAME: testContainer.getUsername(),
    DATABASE_PASSWORD: testContainer.getPassword(),
    DATABASE_NAME: testContainer.getDatabase(),
    DATABASE_SYNCHRONIZE: 'true',
    DATABASE_LOGGING: 'false',
    JWT_SECRET: 'test-jwt-secret-key-for-testing',
    JWT_EXPIRES_IN: '1d',
    NODE_ENV: 'test',
  };
}
