# PostgreSQL - Info Schema (Part 9)

## 35.19. constraint_table_usage #


**URL:** https://www.postgresql.org/docs/18/infoschema-constraint-table-usage.html

**Contents:**
- 35.19. constraint_table_usage #

The view constraint_table_usage identifies all tables in the current database that are used by some constraint and are owned by a currently enabled role. (This is different from the view table_constraints, which identifies all table constraints along with the table they are defined on.) For a foreign key constraint, this view identifies the table that the foreign key references. For a unique or primary key constraint, this view simply identifies the table the constraint belongs to. Check constraints and not-null constraints are not included in this view.

Table 35.17. constraint_table_usage Columns

table_catalog sql_identifier

Name of the database that contains the table that is used by some constraint (always the current database)

table_schema sql_identifier

Name of the schema that contains the table that is used by some constraint

table_name sql_identifier

Name of the table that is used by some constraint

constraint_catalog sql_identifier

Name of the database that contains the constraint (always the current database)

constraint_schema sql_identifier

Name of the schema that contains the constraint

constraint_name sql_identifier

Name of the constraint

**Examples:**

Example 1 (unknown):
```unknown
constraint_table_usage
```

Example 2 (unknown):
```unknown
constraint_table_usage
```

Example 3 (unknown):
```unknown
constraint_table_usage
```

Example 4 (unknown):
```unknown
table_constraints
```

---


---

## 35.64. view_routine_usage #


**URL:** https://www.postgresql.org/docs/18/infoschema-view-routine-usage.html

**Contents:**
- 35.64. view_routine_usage #

The view view_routine_usage identifies all routines (functions and procedures) that are used in the query expression of a view (the SELECT statement that defines the view). A routine is only included if that routine is owned by a currently enabled role.

Table 35.62. view_routine_usage Columns

table_catalog sql_identifier

Name of the database containing the view (always the current database)

table_schema sql_identifier

Name of the schema containing the view

table_name sql_identifier

specific_catalog sql_identifier

Name of the database containing the function (always the current database)

specific_schema sql_identifier

Name of the schema containing the function

specific_name sql_identifier

The “specific name” of the function. See Section 35.45 for more information.

**Examples:**

Example 1 (unknown):
```unknown
view_routine_usage
```

Example 2 (unknown):
```unknown
view_routine_usage
```

Example 3 (unknown):
```unknown
view_routine_usage
```

Example 4 (unknown):
```unknown
view_routine_usage
```

---


---

## 35.8. check_constraint_routine_usage #


**URL:** https://www.postgresql.org/docs/18/infoschema-check-constraint-routine-usage.html

**Contents:**
- 35.8. check_constraint_routine_usage #

The view check_constraint_routine_usage identifies routines (functions and procedures) that are used by a check constraint. Only those routines are shown that are owned by a currently enabled role.

Table 35.6. check_constraint_routine_usage Columns

constraint_catalog sql_identifier

Name of the database containing the constraint (always the current database)

constraint_schema sql_identifier

Name of the schema containing the constraint

constraint_name sql_identifier

Name of the constraint

specific_catalog sql_identifier

Name of the database containing the function (always the current database)

specific_schema sql_identifier

Name of the schema containing the function

specific_name sql_identifier

The “specific name” of the function. See Section 35.45 for more information.

**Examples:**

Example 1 (unknown):
```unknown
check_constraint_routine_usage
```

Example 2 (unknown):
```unknown
check_constraint_routine_usage
```

Example 3 (unknown):
```unknown
check_constraint_routine_usage
```

Example 4 (unknown):
```unknown
check_constraint_routine_usage
```

---


---

## 35.59. usage_privileges #


**URL:** https://www.postgresql.org/docs/18/infoschema-usage-privileges.html

**Contents:**
- 35.59. usage_privileges #

The view usage_privileges identifies USAGE privileges granted on various kinds of objects to a currently enabled role or by a currently enabled role. In PostgreSQL, this currently applies to collations, domains, foreign-data wrappers, foreign servers, and sequences. There is one row for each combination of object, grantor, and grantee.

Since collations do not have real privileges in PostgreSQL, this view shows implicit non-grantable USAGE privileges granted by the owner to PUBLIC for all collations. The other object types, however, show real privileges.

In PostgreSQL, sequences also support SELECT and UPDATE privileges in addition to the USAGE privilege. These are nonstandard and therefore not visible in the information schema.

Table 35.57. usage_privileges Columns

grantor sql_identifier

Name of the role that granted the privilege

grantee sql_identifier

Name of the role that the privilege was granted to

object_catalog sql_identifier

Name of the database containing the object (always the current database)

object_schema sql_identifier

Name of the schema containing the object, if applicable, else an empty string

object_name sql_identifier

object_type character_data

COLLATION or DOMAIN or FOREIGN DATA WRAPPER or FOREIGN SERVER or SEQUENCE

privilege_type character_data

is_grantable yes_or_no

YES if the privilege is grantable, NO if not

**Examples:**

Example 1 (unknown):
```unknown
usage_privileges
```

Example 2 (unknown):
```unknown
usage_privileges
```

Example 3 (unknown):
```unknown
usage_privileges
```

Example 4 (unknown):
```unknown
usage_privileges
```

---


---

## 35.63. view_column_usage #


**URL:** https://www.postgresql.org/docs/18/infoschema-view-column-usage.html

**Contents:**
- 35.63. view_column_usage #
  - Note

The view view_column_usage identifies all columns that are used in the query expression of a view (the SELECT statement that defines the view). A column is only included if the table that contains the column is owned by a currently enabled role.

Columns of system tables are not included. This should be fixed sometime.

Table 35.61. view_column_usage Columns

view_catalog sql_identifier

Name of the database that contains the view (always the current database)

view_schema sql_identifier

Name of the schema that contains the view

view_name sql_identifier

table_catalog sql_identifier

Name of the database that contains the table that contains the column that is used by the view (always the current database)

table_schema sql_identifier

Name of the schema that contains the table that contains the column that is used by the view

table_name sql_identifier

Name of the table that contains the column that is used by the view

column_name sql_identifier

Name of the column that is used by the view

**Examples:**

Example 1 (unknown):
```unknown
view_column_usage
```

Example 2 (unknown):
```unknown
view_column_usage
```

Example 3 (unknown):
```unknown
view_column_usage
```

Example 4 (unknown):
```unknown
view_column_usage
```

---


---

