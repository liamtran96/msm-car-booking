import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export default function globalTeardown(): void {
  console.log('\n🧹 Cleaning up test database...');

  const container = (globalThis as Record<string, unknown>)
    .__TEST_CONTAINER__ as StartedPostgreSqlContainer;

  if (container) {
    // Don't stop if reuse is enabled - container will persist
    console.log(
      '✅ Test container cleanup complete (container reused for next run)',
    );
  }
}
