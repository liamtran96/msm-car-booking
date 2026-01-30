# Schema Design Standards

## Database Design Rules

### Normalization
- **Minimum**: 3NF (Third Normal Form)
- **Denormalize**: Only for proven performance needs
- **Document**: Any denormalization decisions

### Naming Conventions
- **Tables**: snake_case, plural (`users`, `trip_costs`)
- **Columns**: snake_case (`created_at`, `user_id`)
- **Indexes**: `idx_{table}_{column}` or `idx_{table}_{purpose}`
- **Constraints**: `{table}_{column}_{type}` (e.g., `users_email_unique`)

### Standard Columns
Every table should have:
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
created_at timestamptz DEFAULT now(),
updated_at timestamptz DEFAULT now(),
deleted_at timestamptz  -- For soft delete
```

### Foreign Keys
```sql
-- Always create covering index
ALTER TABLE public.orders ADD COLUMN customer_id uuid REFERENCES public.customers(id);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
```

## Migration Standards

### Structure
```sql
-- Migration: [Description]
-- Compliance: Functions have search_path, Views have security_invoker,
--             Tables have RLS, Policies use (SELECT auth.uid())

BEGIN;

-- Your migration here

COMMIT;
```

### Quality Requirements
- **Atomicity**: Wrap in transactions
- **Reversibility**: Include rollback steps in comments
- **Safety**: No data loss, backward compatible
- **Performance**: Execute < 5 minutes

### Table Creation Template
```sql
CREATE TABLE public.my_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  -- business columns here
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Enable RLS immediately
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- Index foreign keys
CREATE INDEX idx_my_table_user_id ON public.my_table(user_id);

-- Create RLS policies with optimized auth.uid()
CREATE POLICY "my_table_select" ON public.my_table
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));
```

## Index Strategy

### When to Index
- Foreign key columns (always)
- Columns in WHERE clauses (frequently queried)
- Columns in ORDER BY (for sorted results)
- Columns in JOIN conditions

### Index Types
```sql
-- B-tree (default, most common)
CREATE INDEX idx_users_email ON public.users(email);

-- Partial index (for filtered queries)
CREATE INDEX idx_orders_active ON public.orders(status)
WHERE deleted_at IS NULL;

-- Composite index (for multi-column queries)
CREATE INDEX idx_trips_driver_date ON public.trips(driver_id, start_date);
```

### Avoid
- Indexes on low-cardinality columns
- Too many indexes (slows writes)
- Duplicate indexes

## RLS Policy Architecture

### Policy Naming
- `{table}_{action}` (e.g., `orders_select`, `trips_update`)
- One policy per role/action combination

### Performance Pattern
```sql
-- GOOD: Evaluated once
WHERE user_id = (SELECT auth.uid())

-- BAD: Evaluated per row
WHERE user_id = auth.uid()
```

### Role-Based Access
```sql
-- Owner can see all
CREATE POLICY "orders_select_owner" ON public.orders
FOR SELECT TO authenticated
USING (
  (SELECT get_user_role((SELECT auth.uid()))) = 'owner'
);

-- Users see their own
CREATE POLICY "orders_select_user" ON public.orders
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (SELECT get_user_role((SELECT auth.uid()))) = 'owner'
);
```

## View Standards

### Always Use security_invoker
```sql
CREATE VIEW public.active_orders
WITH (security_invoker = true)
AS SELECT * FROM public.orders WHERE deleted_at IS NULL;
```

### Why?
- Without `security_invoker`, view runs with definer's permissions
- Users could see data they shouldn't through the view
- RLS policies are bypassed

## Function Standards

### Always Set search_path
```sql
CREATE OR REPLACE FUNCTION public.my_function()
RETURNS void
LANGUAGE plpgsql
SET search_path = public  -- REQUIRED
AS $$
BEGIN
  -- function body
END;
$$;
```

### Why?
- Prevents SQL injection via search_path manipulation
- Ensures function uses intended schema
- Required by Supabase security linter
