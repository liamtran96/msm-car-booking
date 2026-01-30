# Supabase Security Checklist

## Function Checklist
- [ ] `SET search_path = public` included
- [ ] Schema-qualified table names (`public.tablename`)
- [ ] SECURITY DEFINER only if necessary
- [ ] Input validated

## View Checklist
- [ ] `WITH (security_invoker = true)` included
- [ ] Underlying tables have RLS
- [ ] Minimal column selection

## Table Checklist
- [ ] RLS enabled immediately
- [ ] Policies for SELECT, INSERT, UPDATE, DELETE
- [ ] Foreign keys indexed
- [ ] `deleted_at` column for soft delete
- [ ] `created_at`, `updated_at` timestamps

## RLS Policy Checklist
- [ ] `auth.uid()` wrapped: `(SELECT auth.uid())`
- [ ] `get_user_role()` wrapped in subquery
- [ ] No duplicate policies per role/action
- [ ] Uses `TO authenticated` (not `TO public`)

## Index Checklist
- [ ] Foreign keys indexed
- [ ] Frequently queried columns indexed
- [ ] No duplicate indexes

## Migration Template

```sql
-- Migration: [Description]
-- Compliance: Functions have search_path, Views have security_invoker,
--             Tables have RLS, Policies use (SELECT auth.uid())

CREATE TABLE public.my_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_my_table_user_id ON public.my_table(user_id);

CREATE POLICY "my_table_select" ON public.my_table
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE VIEW public.active_my_table
WITH (security_invoker = true)
AS SELECT * FROM public.my_table WHERE deleted_at IS NULL;

CREATE FUNCTION public.my_function()
RETURNS void LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN /* code */ END; $$;
```
