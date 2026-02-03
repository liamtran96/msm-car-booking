---
id: coding-standards
title: Coding Standards
sidebar_position: 7
---

# Coding Standards

Development conventions and best practices for the MSM Car Booking System. For the complete reference, see the project's `CLAUDE.md`.

---

## TypeScript / NestJS

### General Rules

- Use strict TypeScript - avoid `any` types
- Use `try/catch` for error handling
- Use UUID primary keys for all database entities
- Use parameterized queries (TypeORM handles this automatically)
- Follow NestJS module structure: `module → controller → service → entity`

### Naming Conventions

- **Files:** kebab-case (`booking-status.enum.ts`)
- **Classes:** PascalCase (`BookingService`)
- **Variables/Functions:** camelCase (`findActiveBookings`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Database columns:** snake_case (`created_at`)

### Entity Standards

- All entities use UUID primary keys
- Implement soft delete with `is_active` boolean flag
- Include `created_at` and `updated_at` timestamps
- Use TypeORM decorators for relationships and validation

### Service Patterns

- Business logic belongs in services, not controllers
- Use database transactions for critical operations
- Validate status transitions before updating
- Log critical operations for audit trail

---

## React / Frontend

### React 19 Rules

- **DO NOT** use `useCallback` or `useMemo` - React 19 Compiler handles memoization
- Use clear, meaningful variable names (never single letters)
- Use Shadcn UI components from `src/components/ui/`
- Follow the design system in `docs-site/docs/frontend/design-system.md`

### Form Implementation

- Use shared hooks from `src/hooks/forms/`:
  - `useFormSubmit` for form submission with toast notifications
  - `useFormReset` for dialog-based form reset
  - `useReceiptUpload` for receipt uploads
- Use React Hook Form with Zod validation
- Use centralized utilities from `src/lib/` and `src/constants/`

### Styling

- Use Tailwind CSS utility classes only
- Never create new CSS classes or design tokens
- Reuse existing component patterns from similar pages
- Follow common patterns: `grid grid-cols-1 sm:grid-cols-2 gap-4` for form grids

---

## Testing

### Strategy

| Level | Location | Database | Command |
|-------|----------|----------|---------|
| Unit | `src/modules/*/*.spec.ts` | Mocked | `pnpm test` |
| Integration | `test/integration/*.integration-spec.ts` | Testcontainers | `pnpm test:integration` |
| E2E | `test/e2e/*.e2e-spec.ts` | Testcontainers | `pnpm test:e2e` |

### Coverage Requirements

- Services: 90%+ code coverage
- Controllers: 100% endpoint coverage
- Test all HTTP methods, auth (401), authorization (403), validation (400), not-found (404)

### Best Practices

- Use the spy pattern for mocks: `let findOneSpy: jest.Mock` (avoids ESLint `unbound-method` errors)
- Use test factories from `src/test/factories/`
- Test error scenarios and edge cases
- Follow existing business logic - never invent behaviors

---

## Commit Standards

### Format

Use conventional commits:

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type | Use Case |
|------|----------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Build, CI, tooling changes |

### Rules

- Run linting before commit
- Run tests before push
- Never bypass git hooks with `--no-verify`
- Never commit secrets (`.env`, API keys, credentials)
- Add changesets for user-facing changes via `pnpm changeset`
