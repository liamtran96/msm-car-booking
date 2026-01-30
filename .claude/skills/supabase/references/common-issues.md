# Common Supabase Issues & Fixes

## Security Issues

### Function Search Path Mutable
**Error:** `Function X has a role mutable search_path`
**Risk:** SQL injection vulnerability
**Fix:**
```sql
CREATE OR REPLACE FUNCTION public.my_function()
RETURNS void LANGUAGE plpgsql
SET search_path = public  -- Add this line
AS $$ BEGIN /* code */ END; $$;
```

### Security Definer View
**Error:** `View X is defined with SECURITY DEFINER`
**Risk:** RLS bypass - users see data they shouldn't
**Fix:**
```sql
DROP VIEW IF EXISTS public.my_view;
CREATE VIEW public.my_view
WITH (security_invoker = true)  -- Add this
AS SELECT * FROM my_table;
```

### Table Without RLS
**Error:** Table accessible without authentication
**Risk:** Data exposed to anonymous users
**Fix:**
```sql
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
-- Then create policies
```

## Performance Issues

### Unindexed Foreign Keys
**Error:** `Foreign key X without covering index`
**Impact:** Slow JOINs and constraint checks
**Fix:**
```sql
CREATE INDEX idx_table_column ON public.table(foreign_key_column);
```

### Multiple Permissive Policies
**Error:** `Multiple permissive policies for role X action Y`
**Impact:** Both policies evaluated per query
**Fix:** Consolidate into one policy:
```sql
-- Drop old policies
DROP POLICY "policy1" ON public.table;
DROP POLICY "policy2" ON public.table;

-- Create consolidated policy
CREATE POLICY "table_select" ON public.table
FOR SELECT USING (condition1 OR condition2);
```

### RLS Performance (auth.uid per row)
**Error:** Slow queries on large tables
**Impact:** O(n) function calls instead of O(1)
**Fix:**
```sql
-- BAD
WHERE user_id = auth.uid()

-- GOOD
WHERE user_id = (SELECT auth.uid())
```

## Verification Queries

```sql
-- Functions missing search_path
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (p.proconfig IS NULL OR NOT EXISTS (
  SELECT 1 FROM unnest(p.proconfig) WHERE unnest LIKE 'search_path=%'
));

-- Tables without RLS
SELECT tablename FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' AND NOT rowsecurity;

-- Multiple permissive policies
SELECT tablename, cmd, count(*)
FROM pg_policies WHERE schemaname = 'public' AND permissive = 'PERMISSIVE'
GROUP BY tablename, cmd, roles HAVING count(*) > 1;
```
