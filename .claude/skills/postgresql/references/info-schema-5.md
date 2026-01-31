# PostgreSQL - Info Schema (Part 5)

## 35.58. udt_privileges #


**URL:** https://www.postgresql.org/docs/18/infoschema-udt-privileges.html

**Contents:**
- 35.58. udt_privileges #

The view udt_privileges identifies USAGE privileges granted on user-defined types to a currently enabled role or by a currently enabled role. There is one row for each combination of type, grantor, and grantee. This view shows only composite types (see under Section 35.60 for why); see Section 35.59 for domain privileges.

Table 35.56. udt_privileges Columns

grantor sql_identifier

Name of the role that granted the privilege

grantee sql_identifier

Name of the role that the privilege was granted to

udt_catalog sql_identifier

Name of the database containing the type (always the current database)

udt_schema sql_identifier

Name of the schema containing the type

udt_name sql_identifier

privilege_type character_data

is_grantable yes_or_no

YES if the privilege is grantable, NO if not

**Examples:**

Example 1 (unknown):
```unknown
udt_privileges
```

Example 2 (unknown):
```unknown
udt_privileges
```

Example 3 (unknown):
```unknown
udt_privileges
```

Example 4 (unknown):
```unknown
udt_privileges
```

---


---

## 35.3. information_schema_catalog_name #


**URL:** https://www.postgresql.org/docs/18/infoschema-information-schema-catalog-name.html

**Contents:**
- 35.3. information_schema_catalog_name #

information_schema_catalog_name is a table that always contains one row and one column containing the name of the current database (current catalog, in SQL terminology).

Table 35.1. information_schema_catalog_name Columns

catalog_name sql_identifier

Name of the database that contains this information schema

**Examples:**

Example 1 (unknown):
```unknown
information_schema_catalog_name
```

Example 2 (unknown):
```unknown
information_schema_catalog_name
```

Example 3 (unknown):
```unknown
information_schema_catalog_name
```

Example 4 (unknown):
```unknown
information_schema_catalog_name
```

---


---

## 35.18. constraint_column_usage #


**URL:** https://www.postgresql.org/docs/18/infoschema-constraint-column-usage.html

**Contents:**
- 35.18. constraint_column_usage #

The view constraint_column_usage identifies all columns in the current database that are used by some constraint. Only those columns are shown that are contained in a table owned by a currently enabled role. For a check constraint, this view identifies the columns that are used in the check expression. For a not-null constraint, this view identifies the column that the constraint is defined on. For a foreign key constraint, this view identifies the columns that the foreign key references. For a unique or primary key constraint, this view identifies the constrained columns.

Table 35.16. constraint_column_usage Columns

table_catalog sql_identifier

Name of the database that contains the table that contains the column that is used by some constraint (always the current database)

table_schema sql_identifier

Name of the schema that contains the table that contains the column that is used by some constraint

table_name sql_identifier

Name of the table that contains the column that is used by some constraint

column_name sql_identifier

Name of the column that is used by some constraint

constraint_catalog sql_identifier

Name of the database that contains the constraint (always the current database)

constraint_schema sql_identifier

Name of the schema that contains the constraint

constraint_name sql_identifier

Name of the constraint

**Examples:**

Example 1 (unknown):
```unknown
constraint_column_usage
```

Example 2 (unknown):
```unknown
constraint_column_usage
```

Example 3 (unknown):
```unknown
constraint_column_usage
```

Example 4 (unknown):
```unknown
constraint_column_usage
```

---


---

## 35.25. enabled_roles #


**URL:** https://www.postgresql.org/docs/18/infoschema-enabled-roles.html

**Contents:**
- 35.25. enabled_roles #

The view enabled_roles identifies the currently “enabled roles”. The enabled roles are recursively defined as the current user together with all roles that have been granted to the enabled roles with automatic inheritance. In other words, these are all roles that the current user has direct or indirect, automatically inheriting membership in.

For permission checking, the set of “applicable roles” is applied, which can be broader than the set of enabled roles. So generally, it is better to use the view applicable_roles instead of this one; See Section 35.5 for details on applicable_roles view.

Table 35.23. enabled_roles Columns

role_name sql_identifier

**Examples:**

Example 1 (unknown):
```unknown
enabled_roles
```

Example 2 (unknown):
```unknown
enabled_roles
```

Example 3 (unknown):
```unknown
enabled_roles
```

Example 4 (unknown):
```unknown
applicable_roles
```

---


---

## 35.57. triggers #


**URL:** https://www.postgresql.org/docs/18/infoschema-triggers.html

**Contents:**
- 35.57. triggers #
  - Note

The view triggers contains all triggers defined in the current database on tables and views that the current user owns or has some privilege other than SELECT on.

Table 35.55. triggers Columns

trigger_catalog sql_identifier

Name of the database that contains the trigger (always the current database)

trigger_schema sql_identifier

Name of the schema that contains the trigger

trigger_name sql_identifier

event_manipulation character_data

Event that fires the trigger (INSERT, UPDATE, or DELETE)

event_object_catalog sql_identifier

Name of the database that contains the table that the trigger is defined on (always the current database)

event_object_schema sql_identifier

Name of the schema that contains the table that the trigger is defined on

event_object_table sql_identifier

Name of the table that the trigger is defined on

action_order cardinal_number

Firing order among triggers on the same table having the same event_manipulation, action_timing, and action_orientation. In PostgreSQL, triggers are fired in name order, so this column reflects that.

action_condition character_data

WHEN condition of the trigger, null if none (also null if the table is not owned by a currently enabled role)

action_statement character_data

Statement that is executed by the trigger (currently always EXECUTE FUNCTION function(...))

action_orientation character_data

Identifies whether the trigger fires once for each processed row or once for each statement (ROW or STATEMENT)

action_timing character_data

Time at which the trigger fires (BEFORE, AFTER, or INSTEAD OF)

action_reference_old_table sql_identifier

Name of the “old” transition table, or null if none

action_reference_new_table sql_identifier

Name of the “new” transition table, or null if none

action_reference_old_row sql_identifier

Applies to a feature not available in PostgreSQL

action_reference_new_row sql_identifier

Applies to a feature not available in PostgreSQL

Applies to a feature not available in PostgreSQL

Triggers in PostgreSQL have two incompatibilities with the SQL standard that affect the representation in the information schema. First, trigger names are local to each table in PostgreSQL, rather than being independent schema objects. Therefore there can be duplicate trigger names defined in one schema, so long as they belong to different tables. (trigger_catalog and trigger_schema are really the values pertaining to the table that the trigger is defined on.) Second, triggers can be defined to fire on multiple events in PostgreSQL (e.g., ON INSERT OR UPDATE), whereas the SQL standard only allows one. If a trigger is defined to fire on multiple events, it is represented as multiple rows in the information schema, one for each type of event. As a consequence of these two issues, the primary key of the view triggers is really (trigger_catalog, trigger_schema, event_object_table, trigger_name, event_manipulation) instead of (trigger_catalog, trigger_schema, trigger_name), which is what the SQL standard specifies. Nonetheless, if you define your triggers in a manner that conforms with the SQL standard (trigger names unique in the schema and only one event type per trigger), this will not affect you.

Prior to PostgreSQL 9.1, this view's columns action_timing, action_reference_old_table, action_reference_new_table, action_reference_old_row, and action_reference_new_row were named condition_timing, condition_reference_old_table, condition_reference_new_table, condition_reference_old_row, and condition_reference_new_row respectively. That was how they were named in the SQL:1999 standard. The new naming conforms to SQL:2003 and later.

**Examples:**

Example 1 (unknown):
```unknown
trigger_catalog
```

Example 2 (unknown):
```unknown
sql_identifier
```

Example 3 (unknown):
```unknown
trigger_schema
```

Example 4 (unknown):
```unknown
sql_identifier
```

---


---

## 35.42. routine_routine_usage #


**URL:** https://www.postgresql.org/docs/18/infoschema-routine-routine-usage.html

**Contents:**
- 35.42. routine_routine_usage #

The view routine_routine_usage identifies all functions or procedures that are used by another (or the same) function or procedure, either in the SQL body or in parameter default expressions. (This only works for unquoted SQL bodies, not quoted bodies or functions in other languages.) An entry is included here only if the used function is owned by a currently enabled role. (There is no such restriction on the using function.)

Note that the entries for both functions in the view refer to the “specific” name of the routine, even though the column names are used in a way that is inconsistent with other information schema views about routines. This is per SQL standard, although it is arguably a misdesign. See Section 35.45 for more information about specific names.

Table 35.40. routine_routine_usage Columns

specific_catalog sql_identifier

Name of the database containing the using function (always the current database)

specific_schema sql_identifier

Name of the schema containing the using function

specific_name sql_identifier

The “specific name” of the using function.

routine_catalog sql_identifier

Name of the database that contains the function that is used by the first function (always the current database)

routine_schema sql_identifier

Name of the schema that contains the function that is used by the first function

routine_name sql_identifier

The “specific name” of the function that is used by the first function.

**Examples:**

Example 1 (unknown):
```unknown
routine_routine_usage
```

Example 2 (unknown):
```unknown
routine_routine_usage
```

Example 3 (unknown):
```unknown
routine_routine_usage
```

Example 4 (unknown):
```unknown
routine_routine_usage
```

---


---

