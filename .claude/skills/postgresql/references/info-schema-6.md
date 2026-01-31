# PostgreSQL - Info Schema (Part 6)

## 35.52. table_constraints #


**URL:** https://www.postgresql.org/docs/18/infoschema-table-constraints.html

**Contents:**
- 35.52. table_constraints #

The view table_constraints contains all constraints belonging to tables that the current user owns or has some privilege other than SELECT on.

Table 35.50. table_constraints Columns

constraint_catalog sql_identifier

Name of the database that contains the constraint (always the current database)

constraint_schema sql_identifier

Name of the schema that contains the constraint

constraint_name sql_identifier

Name of the constraint

table_catalog sql_identifier

Name of the database that contains the table (always the current database)

table_schema sql_identifier

Name of the schema that contains the table

table_name sql_identifier

constraint_type character_data

Type of the constraint: CHECK (includes not-null constraints), FOREIGN KEY, PRIMARY KEY, or UNIQUE

is_deferrable yes_or_no

YES if the constraint is deferrable, NO if not

initially_deferred yes_or_no

YES if the constraint is deferrable and initially deferred, NO if not

YES if the constraint is enforced, NO if not

nulls_distinct yes_or_no

If the constraint is a unique constraint, then YES if the constraint treats nulls as distinct or NO if it treats nulls as not distinct, otherwise null for other types of constraints.

**Examples:**

Example 1 (unknown):
```unknown
table_constraints
```

Example 2 (unknown):
```unknown
table_constraints
```

Example 3 (unknown):
```unknown
table_constraints
```

Example 4 (unknown):
```unknown
table_constraints
```

---


---

## 35.32. key_column_usage #


**URL:** https://www.postgresql.org/docs/18/infoschema-key-column-usage.html

**Contents:**
- 35.32. key_column_usage #

The view key_column_usage identifies all columns in the current database that are restricted by some unique, primary key, or foreign key constraint. Check constraints are not included in this view. Only those columns are shown that the current user has access to, by way of being the owner or having some privilege.

Table 35.30. key_column_usage Columns

constraint_catalog sql_identifier

Name of the database that contains the constraint (always the current database)

constraint_schema sql_identifier

Name of the schema that contains the constraint

constraint_name sql_identifier

Name of the constraint

table_catalog sql_identifier

Name of the database that contains the table that contains the column that is restricted by this constraint (always the current database)

table_schema sql_identifier

Name of the schema that contains the table that contains the column that is restricted by this constraint

table_name sql_identifier

Name of the table that contains the column that is restricted by this constraint

column_name sql_identifier

Name of the column that is restricted by this constraint

ordinal_position cardinal_number

Ordinal position of the column within the constraint key (count starts at 1)

position_in_unique_constraint cardinal_number

For a foreign-key constraint, ordinal position of the referenced column within its unique constraint (count starts at 1); otherwise null

**Examples:**

Example 1 (unknown):
```unknown
key_column_usage
```

Example 2 (unknown):
```unknown
key_column_usage
```

Example 3 (unknown):
```unknown
key_column_usage
```

Example 4 (unknown):
```unknown
key_column_usage
```

---


---

## 35.28. foreign_server_options #


**URL:** https://www.postgresql.org/docs/18/infoschema-foreign-server-options.html

**Contents:**
- 35.28. foreign_server_options #

The view foreign_server_options contains all the options defined for foreign servers in the current database. Only those foreign servers are shown that the current user has access to (by way of being the owner or having some privilege).

Table 35.26. foreign_server_options Columns

foreign_server_catalog sql_identifier

Name of the database that the foreign server is defined in (always the current database)

foreign_server_name sql_identifier

Name of the foreign server

option_name sql_identifier

option_value character_data

**Examples:**

Example 1 (unknown):
```unknown
foreign_server_options
```

Example 2 (unknown):
```unknown
foreign_server_options
```

Example 3 (unknown):
```unknown
foreign_server_options
```

Example 4 (unknown):
```unknown
foreign_server_options
```

---


---

## 35.13. column_domain_usage #


**URL:** https://www.postgresql.org/docs/18/infoschema-column-domain-usage.html

**Contents:**
- 35.13. column_domain_usage #

The view column_domain_usage identifies all columns (of a table or a view) that make use of some domain defined in the current database and owned by a currently enabled role.

Table 35.11. column_domain_usage Columns

domain_catalog sql_identifier

Name of the database containing the domain (always the current database)

domain_schema sql_identifier

Name of the schema containing the domain

domain_name sql_identifier

table_catalog sql_identifier

Name of the database containing the table (always the current database)

table_schema sql_identifier

Name of the schema containing the table

table_name sql_identifier

column_name sql_identifier

**Examples:**

Example 1 (unknown):
```unknown
column_domain_usage
```

Example 2 (unknown):
```unknown
column_domain_usage
```

Example 3 (unknown):
```unknown
column_domain_usage
```

Example 4 (unknown):
```unknown
column_domain_usage
```

---


---

## 35.37. role_table_grants #


**URL:** https://www.postgresql.org/docs/18/infoschema-role-table-grants.html

**Contents:**
- 35.37. role_table_grants #

The view role_table_grants identifies all privileges granted on tables or views where the grantor or grantee is a currently enabled role. Further information can be found under table_privileges. The only effective difference between this view and table_privileges is that this view omits tables that have been made accessible to the current user by way of a grant to PUBLIC.

Table 35.35. role_table_grants Columns

grantor sql_identifier

Name of the role that granted the privilege

grantee sql_identifier

Name of the role that the privilege was granted to

table_catalog sql_identifier

Name of the database that contains the table (always the current database)

table_schema sql_identifier

Name of the schema that contains the table

table_name sql_identifier

privilege_type character_data

Type of the privilege: SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, or TRIGGER

is_grantable yes_or_no

YES if the privilege is grantable, NO if not

with_hierarchy yes_or_no

In the SQL standard, WITH HIERARCHY OPTION is a separate (sub-)privilege allowing certain operations on table inheritance hierarchies. In PostgreSQL, this is included in the SELECT privilege, so this column shows YES if the privilege is SELECT, else NO.

**Examples:**

Example 1 (unknown):
```unknown
role_table_grants
```

Example 2 (unknown):
```unknown
role_table_grants
```

Example 3 (unknown):
```unknown
role_table_grants
```

Example 4 (unknown):
```unknown
table_privileges
```

---


---

