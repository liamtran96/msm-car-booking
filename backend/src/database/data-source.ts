import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

/**
 * TypeORM DataSource configuration for CLI commands (migrations, seeding)
 * This is used by TypeORM CLI and is separate from NestJS runtime configuration
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'msm_car_booking',

  // Entity paths - both .ts for development and .js for production
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],

  // Migration configuration
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',

  // Synchronize should be FALSE in production - use migrations instead
  synchronize: false,

  // Logging for debugging
  logging: process.env.DB_LOGGING === 'true',
};

// Export DataSource instance for TypeORM CLI
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
