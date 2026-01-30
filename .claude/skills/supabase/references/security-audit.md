# Security Audit Procedures

## Audit Scope Options

| Flag | Focus Area |
|------|------------|
| `--rls` | Row Level Security policies |
| `--permissions` | Table permissions and grants |
| `--auth` | Authentication configuration |
| `--api-keys` | API key management |
| `--comprehensive` | Full security audit |

## Audit Framework

### 1. RLS Policy Analysis (`--rls`)

**Checks:**
- All public tables have RLS enabled
- Policies exist for SELECT, INSERT, UPDATE, DELETE
- Policies use `(SELECT auth.uid())` pattern
- No multiple permissive policies per action
- Views use `security_invoker = true`

**Verification:**
```sql
-- Tables without RLS
SELECT tablename FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' AND NOT rowsecurity;

-- Multiple permissive policies
SELECT tablename, cmd, count(*)
FROM pg_policies
WHERE schemaname = 'public' AND permissive = 'PERMISSIVE'
GROUP BY tablename, cmd, roles HAVING count(*) > 1;
```

### 2. Permission Assessment (`--permissions`)

**Checks:**
- No unnecessary GRANT to public
- Role hierarchy is correct
- Service role access is limited
- Anon role has minimal permissions

**Verification:**
```sql
-- Check table grants
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public';

-- Check function grants
SELECT grantee, routine_name, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public';
```

### 3. Authentication Security (`--auth`)

**Checks:**
- JWT secret is secure
- Token expiry is appropriate
- Password requirements are set
- MFA is available for sensitive roles

**Configuration Review:**
- `supabase/config.toml` auth settings
- Email/password requirements
- OAuth provider configuration

### 4. API Key Management (`--api-keys`)

**Checks:**
- Anon key only used client-side
- Service role key never exposed
- Keys are not in source code
- Environment variables are used

**Verification:**
```bash
# Search for exposed keys
grep -r "eyJ" --include="*.ts" --include="*.js" src/

# Check .env is gitignored
cat .gitignore | grep .env
```

### 5. Function Security

**Checks:**
- All functions have `SET search_path = public`
- SECURITY DEFINER used only when necessary
- Input validation in functions

**Verification:**
```sql
-- Functions missing search_path
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (p.proconfig IS NULL OR NOT EXISTS (
  SELECT 1 FROM unnest(p.proconfig) WHERE unnest LIKE 'search_path=%'
));

-- Security definer functions
SELECT proname, prosecdef
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND prosecdef = true;
```

## MCP Audit Commands

```bash
# Run all security checks
mcp__supabase-local__get_advisors type=security

# Run performance checks (includes RLS performance)
mcp__supabase-local__get_advisors type=performance

# List all tables
mcp__supabase-local__list_tables schemas=["public"]

# Execute verification queries
mcp__supabase-local__execute_sql query="SELECT ..."
```

## Audit Report Format

```
SUPABASE SECURITY AUDIT REPORT

## Executive Summary
- Overall Security Score: X/100
- Critical Issues: X
- High Priority: X
- Medium Priority: X
- Low Priority: X

## RLS Coverage
| Table | RLS | Policies | Status |
|-------|-----|----------|--------|

## Vulnerabilities
### Critical
- [Issue]: Impact and fix

### High
- [Issue]: Impact and fix

## Recommendations
1. [Priority] - Action
2. [Priority] - Action

## Compliance Checklist
- [ ] All tables have RLS
- [ ] All functions have search_path
- [ ] All views use security_invoker
- [ ] No multiple permissive policies
- [ ] API keys properly scoped
```

## Compliance Requirements

### GDPR
- Data protection policies
- Right to erasure implementation
- Consent management
- Data export capability

### SOC2
- Access control documentation
- Audit logging enabled
- Encryption at rest/transit
- Incident response plan

### Best Practices
- Principle of least privilege
- Defense in depth
- Regular security reviews
- Automated vulnerability scanning
