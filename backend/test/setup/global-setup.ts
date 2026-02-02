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

  console.log(
    `✅ Test database ready at ${container.getHost()}:${container.getMappedPort(5432)}`,
  );
}
