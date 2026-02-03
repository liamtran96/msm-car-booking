# Phase 4: CLAUDE.md Documentation Updates

**Document ID:** PLAN-20260202-E2E-TESTING-04
**Phase:** Documentation Updates
**Status:** Active
**Estimated Effort:** 1-2 hours

## Overview

This phase documents the updates needed for CLAUDE.md to reflect the new E2E and integration testing infrastructure.

---

## Task 4.1: Add Testing Commands Section

Add the following to the **NestJS Development Commands** section in CLAUDE.md:

```markdown
### NestJS Development Commands
```bash
# Development
pnpm start:dev          # Start in watch mode
pnpm start:debug        # Start with debugger
pnpm build              # Build for production

# Database
pnpm typeorm migration:generate src/database/migrations/Name  # Generate migration
pnpm typeorm migration:run      # Run migrations
pnpm typeorm migration:revert   # Revert last migration
pnpm seed:run                   # Run seed scripts
pnpm db:reset                   # Reset and reseed database

# Testing
pnpm test               # Run unit tests
pnpm test:watch         # Run unit tests in watch mode
pnpm test:cov           # Run unit tests with coverage
pnpm test:e2e           # Run E2E tests (testcontainers)
pnpm test:e2e:watch     # Run E2E tests in watch mode
pnpm test:e2e:cov       # Run E2E tests with coverage
pnpm test:integration   # Run integration tests
pnpm test:all           # Run all tests (unit + integration + e2e)

# Linting
pnpm lint               # Run ESLint
pnpm format             # Run Prettier
```

---

## Task 4.2: Add Testing Architecture Section

Add a new section after the Testing section:

```markdown
### Testing Architecture

The backend uses a three-tier testing strategy:

#### 1. Unit Tests (`*.spec.ts`)
- **Location:** `src/modules/*/*.spec.ts`
- **Purpose:** Test individual services and controllers in isolation
- **Database:** Mocked repositories
- **Run:** `pnpm test`

#### 2. Integration Tests (`*.integration-spec.ts`)
- **Location:** `test/integration/*.integration-spec.ts`
- **Purpose:** Test service-to-service interactions with real database
- **Database:** Testcontainers PostgreSQL
- **Run:** `pnpm test:integration`

#### 3. E2E Tests (`*.e2e-spec.ts`)
- **Location:** `test/e2e/*.e2e-spec.ts`
- **Purpose:** Test complete HTTP request/response cycles
- **Database:** Testcontainers PostgreSQL
- **Run:** `pnpm test:e2e`

#### Test Infrastructure

```
backend/
├── test/
│   ├── jest-e2e.json              # E2E test config
│   ├── jest-integration.json      # Integration test config
│   ├── setup/
│   │   ├── test-database.ts       # Testcontainers setup
│   │   ├── global-setup.ts        # Jest global setup
│   │   ├── global-teardown.ts     # Jest global teardown
│   │   ├── test-app.factory.ts    # NestJS test app factory
│   │   └── jest-setup.ts          # Jest environment setup
│   ├── e2e/                       # E2E test files
│   └── integration/               # Integration test files
└── src/test/
    ├── factories/                 # Test data factories
    ├── mocks/                     # Mock utilities
    └── utils/
        ├── test-helper.ts         # General test utilities
        ├── e2e-test-helper.ts     # E2E-specific helpers
        └── database-seeder.ts     # Database seeding utility
```

#### Key Testing Patterns

**1. Use Test Factories**
```typescript
import { createMockUser, createMockDriver } from '../../src/test/factories/user.factory';
import { createMockBooking } from '../../src/test/factories/booking.factory';

const user = createMockUser({ role: UserRole.ADMIN });
const booking = createMockBooking({ status: BookingStatus.PENDING });
```

**2. Use Spy Pattern for Mocks**
```typescript
// ✅ CORRECT: Create mock functions directly as jest.fn()
let findOneSpy: jest.Mock;
let saveSpy: jest.Mock;

beforeEach(async () => {
  findOneSpy = jest.fn();
  saveSpy = jest.fn();

  const mockRepository = {
    findOne: findOneSpy,
    save: saveSpy,
  };
});

// ❌ WRONG: Don't extract methods from mock objects
const mockRepository = createMockRepository();
(mockRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
```

**3. E2E Test Authentication**
```typescript
import { generateTestTokens, authHeader } from '../../src/test/utils/e2e-test-helper';

const tokens = generateTestTokens(jwtService, seededData.users);

// Use tokens in requests
const response = await request(app.getHttpServer())
  .get('/users')
  .set(authHeader(tokens.adminToken))
  .expect(200);
```

**4. Database Cleanup**
```typescript
import { cleanDatabase } from '../setup/test-database';

afterAll(async () => {
  await cleanDatabase(dataSource);
  await app.close();
});
```
```

---

## Task 4.3: Add E2E/Integration Testing Guidelines

Add to the existing Testing section or create new subsection:

```markdown
### E2E Testing Guidelines

#### When to Write E2E Tests
- All controller endpoints must have E2E tests
- Test happy path and common error scenarios
- Test authentication (401) and authorization (403)
- Test validation errors (400)
- Test not found scenarios (404)

#### E2E Test Template
```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { startTestDatabase, cleanDatabase } from '../setup/test-database';
import { createTestApp, TestAppContext } from '../setup/test-app.factory';
import { seedTestData, SeededData } from '../../src/test/utils/database-seeder';
import { generateTestTokens, authHeader, TestTokens } from '../../src/test/utils/e2e-test-helper';

describe('Module (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let context: TestAppContext;
  let app: INestApplication;
  let dataSource: DataSource;
  let seededData: SeededData;
  let tokens: TestTokens;

  beforeAll(async () => {
    container = await startTestDatabase();
    context = await createTestApp(container);
    app = context.app;
    dataSource = context.dataSource;
    seededData = await seedTestData(dataSource);
    tokens = generateTestTokens(context.jwtService, seededData.users);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await app.close();
  });

  describe('GET /endpoint', () => {
    it('should return 200 for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/endpoint')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/endpoint')
        .expect(401);
    });
  });
});
```

### Integration Testing Guidelines

#### When to Write Integration Tests
- Complex multi-service workflows
- Database transaction scenarios
- Event-driven processes
- State machine transitions (booking status flow)

#### Integration Test Template
```typescript
import { DataSource, Repository } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { startTestDatabase, getTestDataSourceOptions, cleanDatabase } from '../setup/test-database';
import { seedTestData, SeededData } from '../../src/test/utils/database-seeder';

describe('Feature Integration', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let module: TestingModule;
  let seededData: SeededData;
  let service: MyService;
  let repo: Repository<MyEntity>;

  beforeAll(async () => {
    container = await startTestDatabase();
    const dsOptions = getTestDataSourceOptions(container);

    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ ...dsOptions, autoLoadEntities: true }),
        TypeOrmModule.forFeature([MyEntity]),
      ],
      providers: [MyService],
    }).compile();

    dataSource = module.get(DataSource);
    service = module.get(MyService);
    repo = module.get(getRepositoryToken(MyEntity));
    seededData = await seedTestData(dataSource);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await module.close();
  });

  describe('Workflow: Step A → Step B', () => {
    it('should complete workflow successfully', async () => {
      // Step A
      const resultA = await service.stepA();
      expect(resultA).toBeDefined();

      // Step B
      const resultB = await service.stepB(resultA.id);
      expect(resultB.status).toBe('COMPLETED');
    });
  });
});
```

### Testcontainers Best Practices

1. **Container Reuse**: Enable reuse to speed up subsequent test runs
   ```typescript
   const container = await new PostgreSqlContainer()
     .withReuse()
     .start();
   ```

2. **Sequential Execution**: Run E2E tests with `--runInBand` to avoid port conflicts

3. **Cleanup**: Always clean database between test suites
   ```typescript
   afterAll(async () => {
     await cleanDatabase(dataSource);
   });
   ```

4. **Timeout Configuration**: E2E tests need longer timeouts
   ```json
   {
     "testTimeout": 60000
   }
   ```

5. **Docker Requirements**: Testcontainers requires Docker to be running
   ```bash
   # Verify Docker is running
   docker info
   ```
```

---

## Task 4.4: Update Pre-commit/Push Rules

Update the Pre-commit/Push Rules section:

```markdown
### Pre-commit/Push Rules
- Run linting before commit
- Run unit tests before push (DO NOT ignore failed tests)
- **Run E2E tests for critical modules before merging PRs**
- Keep commits focused on the actual code changes
- **DO NOT** commit and push any confidential information
- **NEVER use `--no-verify` or bypass git hooks**

### CI/CD Testing Pipeline

```yaml
# Recommended GitHub Actions workflow
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: msm_test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Lint
        run: pnpm lint
      
      - name: Unit tests
        run: pnpm test
      
      - name: E2E tests
        run: pnpm test:e2e
      
      - name: Integration tests
        run: pnpm test:integration
```
```

---

## Task 4.5: Add Testing Checklist

Add to the Quality Checks section:

```markdown
### Testing Quality Checks

Before submitting code for review:

- [ ] All unit tests pass (`pnpm test`)
- [ ] New features have unit tests (90%+ service coverage)
- [ ] Controller endpoints have E2E tests
- [ ] Complex workflows have integration tests
- [ ] E2E tests pass (`pnpm test:e2e`)
- [ ] Integration tests pass (`pnpm test:integration`)
- [ ] No flaky tests introduced
- [ ] Test data factories used consistently
- [ ] Spy pattern used for mocks (avoid ESLint errors)
```

---

## Complete CLAUDE.md Diff

Here's a summary of all changes to make to CLAUDE.md:

### 1. Update Testing Commands
**Location:** NestJS Development Commands section
**Action:** Add new test commands

### 2. Add Testing Architecture Section
**Location:** After existing Testing section
**Action:** Add new section with test infrastructure documentation

### 3. Add E2E/Integration Guidelines
**Location:** After Testing Architecture
**Action:** Add templates and best practices

### 4. Update Pre-commit Rules
**Location:** Pre-commit/Push Rules section
**Action:** Add E2E testing requirement for PRs

### 5. Add Testing Checklist
**Location:** Quality Checks section
**Action:** Add pre-submission checklist

---

## Implementation Steps

1. Open CLAUDE.md in editor
2. Navigate to NestJS Development Commands section
3. Add new test commands
4. Add Testing Architecture section after Testing
5. Add E2E/Integration Guidelines
6. Update Pre-commit/Push Rules
7. Add Testing Checklist to Quality Checks
8. Commit changes with message: `docs: add E2E and integration testing documentation`

---

## Verification

After updating CLAUDE.md:

- [ ] All new commands are documented
- [ ] Testing architecture is clearly explained
- [ ] Templates are copy-paste ready
- [ ] Best practices are actionable
- [ ] Checklist covers all requirements

