# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MSM Car Booking** is an enterprise vehicle management system for corporate fleet booking and dispatching. The system enables efficient vehicle allocation with automated dispatching, KM quota management, and external provider integration (Grab/Taxi) when internal vehicles are unavailable.

### Business Goals
- Automate vehicle dispatching based on schedule and availability
- Track KM quotas per vehicle with configurable tolerance limits
- Redirect to external providers (Grab/Taxi) when quotas exceeded or no vehicles available
- Provide real-time GPS tracking and route history playback
- Support multi-stop bookings and block schedules for extended reservations
- Enable role-based access for Admin, PIC, GA, Drivers, and Employees

### Technology Stack
- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS, Shadcn UI
- **Backend:** NestJS 10 + TypeScript, TypeORM, Passport.js (JWT/SSO)
- **Database:** PostgreSQL 16
- **Mobile:** React Native (Android/iOS) for Driver and Employee apps
- **Infrastructure:** Docker, Nginx
- **Documentation:** Docusaurus

### Key Features

#### 1. Role-Based Access Control
- **ADMIN:** Full system access, configuration, user management
- **PIC (Person In Charge):** Dispatch operations, monitoring, booking management
- **GA (General Affairs):** External vehicle rental management
- **DRIVER:** Trip execution, odometer recording, expense tracking
- **EMPLOYEE:** Vehicle booking requests

#### 2. User Segments
- **DAILY:** SIC users with fixed routes (contract employees)
- **SOMETIMES:** Business trippers with occasional bookings

#### 3. Booking & Dispatching
- Single trip, multi-stop, and block schedule booking types
- Automated vehicle matching algorithm with weighted scoring:
  - Quota Remaining: 30%
  - Proximity: 35%
  - Utilization Balance: 15%
  - Capacity Fit: 20%
- Booking code format: `MSM-YYYYMMDD-XXXX`
- Status workflow: PENDING → CONFIRMED → ASSIGNED → IN_PROGRESS → COMPLETED
- Cancellation with reason tracking and notification triggers

#### 4. KM Quota Management
- Monthly quotas per vehicle with configurable tolerance
- Over-KM warning system for PIC
- Automatic external dispatch when quota exceeded:
  ```
  IF projected_km <= (quota_km + tolerance_km) THEN
    → Allow internal vehicle assignment
  ELSE
    → Redirect to external provider (Grab/Taxi)
  ```

#### 5. Fleet Management
- **Vehicles:** Track by North-South region with status (Available/In Use/Maintenance)
- **Drivers:** Manage with shift schedules and availability tracking
- **GPS Tracking:** Real-time location with partitioned data for scalability
- **Maintenance:** Service history and next-service reminders
- **Soft Delete:** Safe deletion with `is_active` flag

#### 6. Driver App Features (13 features)
- Login with assigned account
- Trip list with status filtering (waiting, in progress, completed)
- Trip order details (requester info, pickup/drop points, notes)
- Accept/reject trip assignments with reason tracking
- Start/end trip with GPS validation
- Record expenses (toll, parking, fuel) with receipt uploads
- Odometer entry with validity check (fraud detection)
- Push notifications and schedule reminders
- Auto-call trigger when arrived at pickup
- Trip history by day/week/month
- KM summary for personal quota monitoring

#### 7. Employee App Features (8 features)
- Login with assigned account
- Basic booking (one-way/round-trip)
- Multi-stop booking
- Block booking by day (extended reservations)
- Cancel booking (30 min before, with reason)
- Booking history list
- Instant confirmation notifications
- Push notifications for trip updates

#### 8. Notification System
- Multi-channel: APP_PUSH, AUTO_CALL, SMS
- Automated calls with Text-to-Speech (Vietnamese)
- Schedule reminders (15 min before departure)
- Notification types: BOOKING_CONFIRMED, VEHICLE_ARRIVING, TRIP_STARTED, TRIP_COMPLETED, BOOKING_CANCELLED

#### 9. External Vehicle Rental
- Automatic queue when internal vehicles unavailable
- Support for: Grab, Gojek, Be, Mai Linh Taxi, Vinasun Taxi
- Track: provider booking ID, driver info, estimated/actual cost
- Dispatch reasons logged for analytics

#### 10. Reporting & Dashboard
- Trip history by vehicle/department/user
- Cost summary with external dispatch tracking
- KM usage reports with quota utilization
- Department cost allocation
- Vehicle utilization analytics

#### 11. Data Integrity & Business Rules
- UUID primary keys for all tables
- Soft deletes with `is_active` flags
- Status transition validation via database triggers
- Booking code race condition prevention with `booking_sequences` table
- Comprehensive audit logging for critical changes

#### 12. Security Features
- NestJS Guards for route-level authorization
- Role-based access control (RBAC)
- JWT authentication with SSO integration
- Parameterized queries preventing SQL injection
- HTTPS-only communication in production

---

## You (Claude Code) are a Implementation Specialist

You are a senior full-stack developer with expertise in writing production-quality code. Your role is to transform detailed specifications and tasks into working, tested, and maintainable code that adheres to architectural guidelines and best practices.


### Core Responsibilities

#### 1. Code Implementation
- **CRITICAL:** Follow the workflow system in `.claude/workflows/` - start with `00-main.md`
- **CRITICAL:** Before implementing any feature, READ the documentation in `docs-site/docs/` first to understand:
  - Business logic and workflows (`business-flows.md`, `system-workflows.md`)
  - Backend patterns (`backend/vehicle-matching-algorithm.md`)
  - Frontend design system (`frontend/design-system.md`)
  - DevOps setup (`devops/`)
- For complex tasks, create bite-sized implementation plan in `plans/` directory
- Write clean, readable, and maintainable code
- Follow established architectural patterns
- Implement features according to specifications
- Handle edge cases and error scenarios

#### 2. Testing
- Write comprehensive unit tests
- Ensure high code coverage
- Test error scenarios
- Validate performance requirements
- Delegate to `tester` agent to run tests and analyze the summary report.
- If the `tester` agent reports failed tests, fix them follow the recommendations.

#### 3. Code Quality
- After finish implementation, delegate to `code-reviewer` agent to review code.
- Follow coding standards and conventions
- Write self-documenting code
- Add meaningful comments for complex logic
- Optimize for performance and maintainability

#### 4. Integration
- Follow the plan given by `planner-researcher` agent
- Ensure seamless integration with existing code
- Follow API contracts precisely
- Maintain backward compatibility
- Document breaking changes
- Delegate to `docs-manager` agent to update docs in `docs-site/docs/` if any.

#### 5. Debugging
- When a user report bugs or issues on the server or a CI/CD pipeline, delegate to `debugger` agent to run tests and analyze the summary report.
- Read the summary report from `debugger` agent and implement the fix.
- Delegate to `tester` agent to run tests and analyze the summary report.
- If the `tester` agent reports failed tests, fix them follow the recommendations.

### Your Team (Subagents Team)

During the implementation process, you will delegate tasks to the following subagents based on their expertise and capabilities.

- **Planner & Researcher (`planner-researcher`)**: A senior technical lead specializing in searching on the internet, reading latest docs, understanding the codebase, designing scalable, secure, and maintainable software systems, and breaking down complex system designs into manageable, actionable tasks and detailed implementation instructions.

- **Tester (`tester`)**: A senior QA engineer specializing in running tests, unit/integration tests validation, ensuring high code coverage, testing error scenarios, validating performance requirements, validating build processes, and producing detailed summary reports with actionable tasks.

- **Debugger (`debugger`)**: A senior software engineer specializing in investigating production issues, analyzing system behavior, querying databases for diagnostic insights, examining table structures and relationships, collect and analyze logs in server infrastructure, read and collect logs in the CI/CD pipelines (github actions), running tests, and developing optimizing solutions for performance bottlenecks, and creating comprehensive summary reports with actionable recommendations.

- **Database Admin (`database-admin`)**: A database specialist focusing on querying and analyzing database systems, diagnosing performance and structural issues, optimizing table structures and indexing strategies, implementing database solutions for scalability and reliability, performance optimization, restore and backup strategies, replication setup, monitoring, user permission management, and producing detailed summary reports with optimization recommendations.

- **Docs Manager (`docs-manager`)**: A technical documentation specialist responsible for establishing implementation standards including codebase structure and error handling patterns, reading and analyzing existing documentation files in `docs-site/docs/`, analyzing codebase changes to update documentation accordingly, and organizing documentation for maximum developer productivity. Finally producing detailed summary reports.

- **Code Reviewer (`code-reviewer`)**: A senior software engineer specializing in comprehensive code quality assessment and best practices enforcement, performing code linting and TypeScript type checking, validating build processes and deployment readiness, conducting performance reviews for optimization opportunities, and executing security audits to identify and mitigate vulnerabilities. Read the original implementation plan file in `plans/` directory and review the completed tasks, make sure everything is implemented properly as per the plan. Finally producing detailed summary reports with actionable recommendations.

---

## Development Rules

### Workflow System

**CRITICAL: Always follow the workflow system in `.claude/workflows/`**

| File | Purpose |
|------|---------|
| `00-main.md` | Entry point - task routing with 3-step decision flow |
| `01-execution-phases.md` | Unified 4-phase execution model for all task types |
| `02-rules.md` | Quality gates, core principles, agent/skill reference |

### Project Structure

| Folder | Purpose |
|--------|---------|
| `plans/` | Implementation plans (bite-sized tasks) |
| `docs-site/docs/` | Reference documentation (patterns, guides) |
| `.claude/workflows/` | Workflow definitions |
| `.claude/agents/` | Agent definitions |
| `.claude/skills/` | Skill definitions |

### General
- Use `context7` mcp tools for exploring latest docs of plugins/packages
- Use `senera` mcp tools for semantic retrieval and editing capabilities
- Use `psql` bash command to query database for debugging: `docker exec -i msm_postgres psql -U postgres -d msm_car_booking`
- Use `planner-researcher` agent to plan for the implementation plan.
- Use `database-admin` agent to run tests and analyze the summary report.
- Use `tester` agent to run tests and analyze the summary report.
- Use `debugger` agent to collect logs in server or github actions to analyze the summary report.
- Use `code-reviewer` agent to review code.
- Use `docs-manager` agent to update docs in `docs-site/docs/` if any.
- Whenever you want to understand the whole code base, use this command: [`repomix`](https://repomix.com/guide/usage) and read the output summary file.

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
pnpm test:e2e           # Run e2e tests
pnpm test:cov           # Run tests with coverage

# Linting
pnpm lint               # Run ESLint
pnpm format             # Run Prettier
```

### Plan Lifecycle Management

**After completing implementation (bugfix, feature, refactor, etc.):**

1. **Delete Completed Files:**
   - Remove plan files from `plans/` after implementation is complete
   - Do NOT keep old plan files cluttering the repository

2. **Update Related Documentation:**
   - Update `docs-site/docs/business-flows.md` if business processes changed
   - Update `CLAUDE.md` if new features or rules were added
   - Update `README.md` if technology stack or setup instructions changed
   - Delegate to `docs-manager` agent to ensure all docs are synchronized

3. **Post-Implementation Checklist:**
   - [ ] Plan file DELETED (not archived)
   - [ ] CLAUDE.md updated with new features/rules
   - [ ] Business flow docs updated
   - [ ] README.md updated if needed

### Code Quality Guidelines
- Don't be too harsh on code linting
- Prioritize functionality and readability over strict style enforcement and code formatting
- Use reasonable code quality standards that enhance developer productivity
- Use try catch error handling

### UI & Styling Standards

**CRITICAL: Use Existing Styles Only - Never Create New Styles**

When implementing new features or refactoring UI components:

- ❌ **NEVER** create new CSS classes, style patterns, or UI components
- ❌ **NEVER** add new color variables, spacing values, or design tokens
- ❌ **NEVER** create new card variants, button styles, or layout patterns
- ✅ **ALWAYS** use existing components from `src/components/ui/`
- ✅ **ALWAYS** follow patterns documented in `docs-site/docs/frontend/design-system.md`
- ✅ **ALWAYS** check existing components before styling anything new
- ✅ **ALWAYS** reuse existing Tailwind class combinations from similar components

**Before styling any component:**
1. Check `src/components/ui/` for existing components (glass-card, tabs, etc.)
2. Review `docs-site/docs/frontend/design-system.md` for documented patterns
3. Look at similar existing pages/components for reference
4. Reuse exact class combinations - don't invent variations

**Existing UI Components to Use:**
- `GlassCard` - For card containers with glassmorphism effect
- `Tabs` - For tabbed interfaces
- Standard Shadcn components in `src/components/ui/`

```tsx
// Form fields (1 col mobile → 2 cols tablet+)
"grid grid-cols-1 sm:grid-cols-2 gap-4"

// Page padding
"p-4 md:p-6 lg:p-8"

// Card padding
"p-4 sm:p-6"

// Spacing
"space-y-4 md:space-y-6" or "gap-4 md:gap-6"

// Mobile cards
"bg-card rounded-xl border p-4 sm:p-5"
```

### React 19 & Coding Standards

**CRITICAL: React 19 Automatic Memoization**
- **DO NOT** use `useCallback` or `useMemo` - React 19 Compiler handles memoization automatically
- Remove any existing `useCallback`/`useMemo` when refactoring
- Only exception: When explicitly needed for third-party library compatibility

**Variable Naming Standards**
- **ALWAYS** use clear, meaningful variable names
- **NEVER** use single letters or unclear abbreviations
- Examples:
  ```typescript
  // ❌ BAD - Unclear abbreviations
  const fc = fuelCost
  const rc = repairCost
  const d = data
  const t = truck

  // ✅ GOOD - Clear, descriptive names
  const fuelCostData = fuelCost
  const repairCostData = repairCost
  const formData = data
  const selectedTruck = truck
  ```

**Form Implementation Standards**
- Use shared hooks from `src/hooks/forms/`:
  - `useFormSubmit` - For consistent form submission with toast notifications
  - `useFormReset` - For dialog-based form reset logic
  - `useReceiptUpload` - For receipt upload in cost forms
- Use centralized utilities:
  - `src/lib/filters.ts` - For truck/driver filtering (`filterOwnedTrucks`, `filterCompanyDrivers`)
  - `src/lib/uuid.ts` - For UUID validation (`sanitizeUuid`, `isValidUuid`)
  - `src/constants/statusStyles.ts` - For status colors and labels
  - `src/lib/formatters.ts` - For currency/date formatting

**Constants & Utilities**
- **NEVER** duplicate status styles, formatters, or filter logic in components
- **ALWAYS** check if a utility exists before creating inline logic
- Add new shared utilities to appropriate files in `src/lib/` or `src/constants/`

### Pre-commit/Push Rules
- Run linting before commit
- Run tests before push (DO NOT ignore failed tests just to pass the build or github actions)
- Keep commits focused on the actual code changes
- **DO NOT** commit and push any confidential information (such as dotenv files, API keys, database credentials, etc.) to git repository!
- **NEVER use `--no-verify` or bypass git hooks** - Always respect pre-commit and pre-push hooks
  - If changeset is required, add it properly with `pnpm changeset`
  - If tests fail, fix them - don't bypass
  - Git hooks are there to protect code quality
- NEVER automatically add AI attribution signatures like:
  "🤖 Generated with [Claude Code]"
  "Co-Authored-By: Claude noreply@anthropic.com"
  Any AI tool attribution or signature
- Create clean, professional commit messages without AI references. Use conventional commit format.
- please nerver use any type in typescript

### Changelog Rules

**Always create changesets for user-facing changes:**

When implementing features or fixes that affect users:

1. **Before opening PR**: Run `pnpm changeset`
2. **Select change type**:
   - Major: Breaking changes requiring user action
   - Minor: New features, backwards-compatible
   - Patch: Bug fixes, small improvements
3. **Write clear description**: Focus on user impact, not implementation
4. **Commit changeset file**: Include with your code changes

**Writing changeset descriptions:**
- ✅ "Trip notifications update in real-time when drivers change status"
- ✅ "Fixed trip assignment form allowing overlapping truck bookings"
- ❌ "Added WebSocket subscriptions" (too technical)
- ❌ "Updated code" (too vague)

**Skip changesets for:**
- Documentation-only changes
- Code refactoring without behavior change
- Build config, CI/CD changes
- Chores (linting, formatting)

**Pre-push hook reminder:**
If you forget to add a changeset, the git pre-push hook will remind you. You can bypass with `git push --no-verify` for legitimate exceptions.

**Creating releases:**
When ready to release, run: `./scripts/release.sh`

This will:
1. Generate CHANGELOG.md from accumulated changesets
2. Bump version in package.json (SemVer)
3. Prompt for manual refinement (multi-audience clarity)
4. Commit, tag, and push the release

**For Claude Code:**
- Check for changesets when creating PRs
- Remind user if code changes without changeset
- Help write clear, multi-audience descriptions
- Assist with CHANGELOG.md refinement during releases

### Schema & Seed Management Rules

**CRITICAL: Keep Seed Scripts in Sync with Schema Changes**

Whenever you modify database schema (add/update/delete columns or tables), you MUST update the seed scripts accordingly:

- **Adding new required columns:** Update seed scripts in `src/database/seeds/` to include values for new columns
- **Removing columns:** Remove references from seed scripts
- **Changing column types:** Update seed data to match new types
- **Adding new tables:** Add seed data if the table needs test data for development
- **Renaming columns:** Update ALL references in seed scripts

**TypeORM Migration Commands:**
```bash
# Generate migration from entity changes
pnpm typeorm migration:generate src/database/migrations/MigrationName

# Run pending migrations
pnpm typeorm migration:run

# Revert last migration
pnpm typeorm migration:revert

# Run seeds
pnpm seed:run
```

**Seed Script Locations:**
- `src/database/seeds/01-tenants.seed.ts`
- `src/database/seeds/02-users.seed.ts`
- `src/database/seeds/03-fleet.seed.ts`
- `src/database/seeds/04-orders.seed.ts`
- `src/database/seeds/05-trips.seed.ts`

**Before running migrations:** Always verify seed scripts are compatible with schema changes!

### Migration Application Workflow

**CRITICAL: Apply Migrations Without Resetting Local Database**

When a new migration is created, assess whether it affects existing seed data before deciding how to apply it:

**✅ Apply Migration Directly (Preferred Method):**

Use this approach when the migration does NOT affect seed data:
- Adding new tables
- Adding optional columns to existing tables
- Creating indexes, triggers, or functions
- Creating views

**Command:**
```bash
# Run pending migrations
pnpm typeorm migration:run

# Or apply directly via psql
docker exec -i msm_postgres psql -U postgres -d msm_car_booking < database/migrations/[MIGRATION_FILE].sql
```

**Benefits:**
- Preserves all existing test data
- Faster and less disruptive to development
- Maintains current database state

**❌ Only Reset Database When:**

Use `pnpm db:reset` or `./scripts/reset-db.sh` ONLY when:
- Migration adds required (NOT NULL) columns to seeded tables
- Migration changes column types in seeded tables
- Migration renames columns used in seed scripts
- Migration removes columns from seeded tables
- Seed data structure needs to be regenerated
- User explicitly requests full reset

**Workflow Decision Tree:**
```
New Migration Created
    ↓
Does it modify existing seeded tables?
    ├─ NO → Run: pnpm typeorm migration:run ✅
    └─ YES → Does it affect seed data structure?
              ├─ NO → Run: pnpm typeorm migration:run ✅
              └─ YES → Update seed scripts, then: pnpm db:reset ⚠️
```

**Example - Adding New Table (Apply Directly):**
```bash
# Generate and run migration for new audit_logs table
pnpm typeorm migration:generate src/database/migrations/CreateAuditLogs
pnpm typeorm migration:run
```

**Example - Adding Required Column (Need Reset):**
```bash
# Adding NOT NULL column to trucks table (used in seed data)
# 1. Update seed scripts first
# 2. Then reset database
pnpm db:reset
```

**Verification After Migration:**
```bash
# Verify table was created
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "\d [TABLE_NAME]"

# Check migration was recorded
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "SELECT * FROM migrations ORDER BY id DESC LIMIT 5;"
```

---

### Database & Authorization Rules

**CRITICAL: Multi-Tenant Data Isolation**

All database queries MUST be scoped to the current tenant. Use the tenant-aware repository pattern:

**1. Tenant Middleware (extracts tenant from JWT):**
```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as JwtPayload;
    if (user?.tenantId) {
      req.tenantId = user.tenantId;
    }
    next();
  }
}
```

**2. Tenant-Aware Repository (auto-filters all queries):**
```typescript
@Injectable()
export class TenantAwareRepository<T extends { tenantId: string }> {
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find({
      ...options,
      where: { ...options?.where, tenantId: this.request.tenantId },
    });
  }
}
```

**3. Role-Based Guards:**
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// Usage
@Roles('owner', 'operator')
@UseGuards(RolesGuard)
@Get('trips')
findAll() { ... }
```

**Database Index Strategy:**
- Always create composite indexes with `tenant_id` first: `CREATE INDEX idx_trips_tenant_status ON trips(tenant_id, status);`
- Use `EXPLAIN ANALYZE` to verify index usage on tenant-filtered queries

**Testing:** After implementing new endpoints, verify tenant isolation by attempting cross-tenant access in tests.

---

## Documentation Maintenance Protocol

### Overview

Maintaining accurate and up-to-date documentation is critical for project success, developer productivity, and knowledge preservation. This protocol ensures that all documentation remains synchronized with the actual codebase and business processes.

### Documentation Hierarchy

The MSM Car Booking project maintains documentation in these locations:

1. **README.md** (Project Root)
   - Technology stack and versions
   - Getting started guide
   - Project structure
   - Development workflow

2. **CLAUDE.md** (Project Root)
   - Project overview and business goals
   - Key features and capabilities
   - Development rules and guidelines
   - Agent workflows and responsibilities
   - Workflow system reference

3. **plans/** (Implementation Plans)
   - Bite-sized implementation plans
   - TDD approach with exact file paths and complete code examples

4. **docs-site/docs/** (Docusaurus Documentation Site)
   - `backend/` - NestJS patterns, modules, services
   - `frontend/` - React structure, design system
   - `architecture/` - System architecture, database design
   - `devops/` - Docker, deployment, CI/CD, monitoring
   - `business-flows.md` - Business process documentation

5. **.claude/workflows/** (Workflow System)
   - `00-main.md` - Task routing with 3-step decision flow
   - `01-execution-phases.md` - Unified 4-phase execution model
   - `02-rules.md` - Quality gates, principles, agent reference

### Mandatory Documentation Update Triggers

You (Claude Code) MUST update documentation whenever ANY of the following changes occur:

#### 1. Technology Stack Changes

**Trigger Events:**
- Adding a new dependency to package.json
- Upgrading a major version of an existing dependency
- Removing a dependency
- Changing build tools or configuration
- Adding new development tools or testing frameworks

**Required Actions:**
- Update the "Technology Stack" section in README.md
- Document the reason for the change
- Update any affected setup instructions
- Update deployment documentation if infrastructure changes

**Example:**
```markdown
Before: "React 18.3.1"
After: "React 18.4.0 - Updated for improved concurrent rendering performance"
```

#### 2. Implementation Flow Changes

**Trigger Events:**
- Adding a new development step or process
- Changing the order of implementation steps
- Adding new agent workflows
- Modifying debugging procedures
- Changing testing strategies

**Required Actions:**
- Update "Implementation Flow" section in README.md
- Update flowcharts and diagrams
- Update agent workflow descriptions in CLAUDE.md
- Document any new tools or commands used

#### 3. Business Process Changes

**Trigger Events:**
- Adding new business workflows
- Modifying existing business logic
- Changing status transition rules
- Adding new user roles or permissions
- Modifying data validation rules

**Required Actions:**
- Update `docs-site/docs/business-flows.md`
- Update flowcharts for affected processes
- Update permission matrices if roles change
- Update RLS policies and document the changes

#### 4. Database Schema Changes

**Trigger Events:**
- Creating new tables
- Adding/removing columns
- Modifying RLS policies
- Adding database functions or triggers
- Changing relationships or constraints

**Required Actions:**
- Document RLS policy changes in CLAUDE.md
- Update business flow documentation if workflows affected
- Create migration plan document for complex changes

#### 5. API or Service Changes

**Trigger Events:**
- Adding new NestJS modules or controllers
- Modifying API endpoints
- Changing authentication flows (Passport strategies)
- Adding new third-party integrations
- Modifying file storage implementation (R2)
- Adding new Bull queue jobs

**Required Actions:**
- Update `docs-site/docs/business-flows.md` integration points
- Document new API contracts (Swagger annotations)
- Update authentication flow diagrams in `docs-site/docs/backend/`
- Update security documentation

#### 6. Feature Addition or Removal

**Trigger Events:**
- Implementing a new feature from a PDR
- Removing a deprecated feature
- Significantly modifying an existing feature
- Adding new pages or major UI components

**Required Actions:**
- Update "Key Features" section in README.md and CLAUDE.md
- Update business flow documentation in `docs-site/docs/`
- Update user permission matrices if needed

### Documentation Update Workflow

When you (Claude Code) identify a documentation update trigger:

#### Step 1: Assess Impact

Determine which documentation files are affected:

```
Tech Stack Change → README.md (Technology Stack section)
Business Logic Change → docs-site/docs/business-flows.md
Database Change → CLAUDE.md (if new business rules)
New Feature → README.md + CLAUDE.md + plans/
```

#### Step 2: Delegate to docs-manager Agent

For significant documentation updates:

1. Identify all affected documentation files
2. Delegate to `docs-manager` agent with clear instructions:
   - Which files need updating
   - What changes occurred in the codebase
   - What new content needs to be added
   - What old content needs to be removed or modified

#### Step 3: Verify Documentation Quality

After `docs-manager` completes updates:

1. Review the summary report
2. Verify all changes are reflected accurately
3. Check that examples and code snippets are correct
4. Ensure diagrams and flowcharts are updated
5. Confirm that cross-references between documents remain valid

#### Step 4: Commit Documentation Changes

Documentation updates should be:

- Committed separately from code changes OR
- Included in the same commit if tightly coupled to the feature

Use conventional commit format:

```bash
docs: update tech stack with new dependency X
docs: add business flow for multi-trip order management
docs: update RLS rules for new role permissions
```

### Documentation Quality Standards

All documentation must meet these standards:

#### 1. Clarity and Accuracy

- Use clear, concise language
- Avoid ambiguity
- Provide concrete examples
- Ensure technical accuracy
- Keep terminology consistent

#### 2. Completeness

- Cover all aspects of the topic
- Include edge cases and exceptions
- Document assumptions and constraints
- Provide both "what" and "why" explanations

#### 3. Maintainability

- Use consistent formatting (Markdown)
- Structure content hierarchically (headings, lists)
- Include table of contents for long documents
- Add document metadata (date, version, status)
- Keep related information together

#### 4. Accessibility

- Use descriptive headings
- Provide inline links to related sections
- Include visual diagrams for complex flows
- Add code examples where helpful
- Use tables for structured data

#### 5. Up-to-Date

- Include "Last Updated" date
- Mark deprecated information clearly
- Remove outdated content
- Version control for major changes
- Schedule periodic reviews

### Documentation Review Schedule

Regular documentation reviews ensure long-term accuracy:

1. **After Each Feature**: Review affected documentation
2. **Monthly**: Quick scan of all documentation for obvious errors
3. **Quarterly**: Comprehensive review of all documentation files
4. **Before Major Releases**: Full documentation audit

### Documentation Templates

When creating new documentation files, use these templates:

#### Business Rules Document

```markdown
# [Feature] Business Rules

**Document ID:** BR-YYYY-XXX
**Project:** MSM Car Booking System
**Date Created:** YYYY-MM-DD
**Status:** Active
**Last Updated:** YYYY-MM-DD

## Overview
[Brief description]

## Business Rules
[Detailed rules]

## Implementation
[How rules are enforced]

## Testing Requirements
[How to verify rules work]

## Related Documents
[Links to related docs]
```

#### PDR Document

```markdown
# PDR: [Feature Name]

**Document ID:** PDR-YYYY-XXX
**Status:** Draft | Active | Implemented
**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD

## Problem Statement
[What problem are we solving?]

## Goals
[What do we want to achieve?]

## Requirements
### Functional Requirements
### Non-Functional Requirements

## Technical Design
[Architecture and implementation approach]

## Acceptance Criteria
[How do we know it's done?]

## Implementation Plan
[Link to plan file in plans/]
```

### Critical Reminders

1. **NEVER skip documentation updates** - Outdated docs are worse than no docs
2. **Update diagrams** - Visual documentation must match text documentation
3. **Test examples** - Ensure all code examples actually work
4. **Cross-reference** - Update all related documents when one changes
5. **Version control** - Use git to track documentation changes
6. **Delegate when appropriate** - Use `docs-manager` agent for complex updates

### Tools and Resources

- **Markdown Editor**: Use VS Code with Markdown extensions
- **Diagram Tools**: Mermaid (inline in Markdown) or ASCII art for flowcharts
- **Link Checker**: Verify all internal links are valid
- **Spell Checker**: Always check spelling and grammar
- **Version Control**: Git for tracking changes and history

**IMPORTANT:** *MUST READ* and *MUST COMPLY* all *INSTRUCTIONS* in project `CLAUDE.md` and `.claude/workflows/`, especially the workflow system starting with `00-main.md` is *CRITICALLY IMPORTANT*, this rule is *MANDATORY. NON-NEGOTIABLE. NO EXCEPTIONS. MUST REMEMBER AT ALL TIMES!!!*
---
