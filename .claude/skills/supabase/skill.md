---
name: supabase
description: Comprehensive Supabase specialist for database schema design, security audits, RLS policies, migrations, and realtime optimization. Use PROACTIVELY for any Supabase/PostgreSQL work.
tools: Read, Write, Edit, Bash, Grep
model: sonnet
argument-hint: [task] | --audit | --schema | --realtime | --migration
---

# Supabase Expert Skill

Comprehensive Supabase/PostgreSQL specialist covering security, schema design, migrations, and realtime optimization.

## Quick Reference - Required Patterns

| Object | Required Pattern |
|--------|-----------------|
| Function | `SET search_path = public` |
| View | `WITH (security_invoker = true)` |
| Table | `ENABLE ROW LEVEL SECURITY` |
| RLS Policy | Use `(SELECT auth.uid())` not `auth.uid()` |
| RLS Policy | One policy per role/action (consolidate with OR) |
| Foreign Key | Create covering index |

## Capabilities

### 1. Security & Performance (`--audit`)
- RLS policy analysis and optimization
- Function search_path security fixes
- View security_invoker enforcement
- Permission audits and vulnerability assessment
- @./references/security-checklist.md
- @./references/common-issues.md
- @./references/security-audit.md

### 2. Schema Design (`--schema`)
- Normalized database schema design
- Table relationships and constraints
- Index optimization strategies
- TypeScript type generation
- @./references/schema-design.md

### 3. Migration Management (`--migration`)
- Safe, reversible migration scripts
- Rollback strategies
- Production impact validation
- @./references/schema-design.md

### 4. Realtime Optimization (`--realtime`)
- WebSocket connection optimization
- Subscription performance tuning
- Connection stability debugging
- @./references/realtime-optimization.md

## MCP Verification Tools

```bash
# Security check
mcp__supabase-local__get_advisors type=security

# Performance check
mcp__supabase-local__get_advisors type=performance

# List tables
mcp__supabase-local__list_tables schemas=["public"]

# Execute SQL
mcp__supabase-local__execute_sql query="..."

# Generate types
mcp__supabase-local__generate_typescript_types
```

## Verification Queries

```sql
-- Tables without RLS
SELECT tablename FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' AND NOT rowsecurity;

-- Functions missing search_path
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (p.proconfig IS NULL OR NOT EXISTS (
  SELECT 1 FROM unnest(p.proconfig) WHERE unnest LIKE 'search_path=%'
));

-- Multiple permissive policies
SELECT tablename, cmd, count(*)
FROM pg_policies WHERE schemaname = 'public' AND permissive = 'PERMISSIVE'
GROUP BY tablename, cmd, roles HAVING count(*) > 1;
```

## Reference Documentation

- @./references/security-checklist.md - Security checklists for all objects
- @./references/common-issues.md - Common issues with fixes
- @./references/schema-design.md - Schema design standards
- @./references/realtime-optimization.md - Realtime performance guide
- @./references/security-audit.md - Security audit procedures
- https://supabase.com/docs/guides/database/database-linter
