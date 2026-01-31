# PostgreSQL - Info Schema (Part 10)

## 35.54. tables #


**URL:** https://www.postgresql.org/docs/18/infoschema-tables.html

**Contents:**
- 35.54. tables #

The view tables contains all tables and views defined in the current database. Only those tables and views are shown that the current user has access to (by way of being the owner or having some privilege).

Table 35.52. tables Columns

table_catalog sql_identifier

Name of the database that contains the table (always the current database)

table_schema sql_identifier

Name of the schema that contains the table

table_name sql_identifier

table_type character_data

Type of the table: BASE TABLE for a persistent base table (the normal table type), VIEW for a view, FOREIGN for a foreign table, or LOCAL TEMPORARY for a temporary table

self_referencing_column_name sql_identifier

Applies to a feature not available in PostgreSQL

reference_generation character_data

Applies to a feature not available in PostgreSQL

user_defined_type_catalog sql_identifier

If the table is a typed table, the name of the database that contains the underlying data type (always the current database), else null.

user_defined_type_schema sql_identifier

If the table is a typed table, the name of the schema that contains the underlying data type, else null.

user_defined_type_name sql_identifier

If the table is a typed table, the name of the underlying data type, else null.

is_insertable_into yes_or_no

YES if the table is insertable into, NO if not (Base tables are always insertable into, views not necessarily.)

YES if the table is a typed table, NO if not

commit_action character_data

**Examples:**

Example 1 (unknown):
```unknown
table_catalog
```

Example 2 (unknown):
```unknown
sql_identifier
```

Example 3 (unknown):
```unknown
table_schema
```

Example 4 (unknown):
```unknown
sql_identifier
```

---


---

## 35.38. role_udt_grants #


**URL:** https://www.postgresql.org/docs/18/infoschema-role-udt-grants.html

**Contents:**
- 35.38. role_udt_grants #

The view role_udt_grants is intended to identify USAGE privileges granted on user-defined types where the grantor or grantee is a currently enabled role. Further information can be found under udt_privileges. The only effective difference between this view and udt_privileges is that this view omits objects that have been made accessible to the current user by way of a grant to PUBLIC. Since data types do not have real privileges in PostgreSQL, but only an implicit grant to PUBLIC, this view is empty.

Table 35.36. role_udt_grants Columns

grantor sql_identifier

The name of the role that granted the privilege

grantee sql_identifier

The name of the role that the privilege was granted to

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
role_udt_grants
```

Example 2 (unknown):
```unknown
role_udt_grants
```

Example 3 (unknown):
```unknown
role_udt_grants
```

Example 4 (unknown):
```unknown
udt_privileges
```

---


---

## 35.21. domain_constraints #


**URL:** https://www.postgresql.org/docs/18/infoschema-domain-constraints.html

**Contents:**
- 35.21. domain_constraints #

The view domain_constraints contains all constraints belonging to domains defined in the current database. Only those domains are shown that the current user has access to (by way of being the owner or having some privilege).

Table 35.19. domain_constraints Columns

constraint_catalog sql_identifier

Name of the database that contains the constraint (always the current database)

constraint_schema sql_identifier

Name of the schema that contains the constraint

constraint_name sql_identifier

Name of the constraint

domain_catalog sql_identifier

Name of the database that contains the domain (always the current database)

domain_schema sql_identifier

Name of the schema that contains the domain

domain_name sql_identifier

is_deferrable yes_or_no

YES if the constraint is deferrable, NO if not

initially_deferred yes_or_no

YES if the constraint is deferrable and initially deferred, NO if not

**Examples:**

Example 1 (unknown):
```unknown
domain_constraints
```

Example 2 (unknown):
```unknown
domain_constraints
```

Example 3 (unknown):
```unknown
domain_constraints
```

Example 4 (unknown):
```unknown
domain_constraints
```

---


---

## 35.50. sql_parts #


**URL:** https://www.postgresql.org/docs/18/infoschema-sql-parts.html

**Contents:**
- 35.50. sql_parts #

The table sql_parts contains information about which of the several parts of the SQL standard are supported by PostgreSQL.

Table 35.48. sql_parts Columns

feature_id character_data

An identifier string containing the number of the part

feature_name character_data

Descriptive name of the part

is_supported yes_or_no

YES if the part is fully supported by the current version of PostgreSQL, NO if not

is_verified_by character_data

Always null, since the PostgreSQL development group does not perform formal testing of feature conformance

comments character_data

Possibly a comment about the supported status of the part

**Examples:**

Example 1 (unknown):
```unknown
character_data
```

Example 2 (unknown):
```unknown
feature_name
```

Example 3 (unknown):
```unknown
character_data
```

Example 4 (unknown):
```unknown
is_supported
```

---


---

## 35.55. transforms #


**URL:** https://www.postgresql.org/docs/18/infoschema-transforms.html

**Contents:**
- 35.55. transforms #

The view transforms contains information about the transforms defined in the current database. More precisely, it contains a row for each function contained in a transform (the “from SQL” or “to SQL” function).

Table 35.53. transforms Columns

udt_catalog sql_identifier

Name of the database that contains the type the transform is for (always the current database)

udt_schema sql_identifier

Name of the schema that contains the type the transform is for

udt_name sql_identifier

Name of the type the transform is for

specific_catalog sql_identifier

Name of the database containing the function (always the current database)

specific_schema sql_identifier

Name of the schema containing the function

specific_name sql_identifier

The “specific name” of the function. See Section 35.45 for more information.

group_name sql_identifier

The SQL standard allows defining transforms in “groups”, and selecting a group at run time. PostgreSQL does not support this. Instead, transforms are specific to a language. As a compromise, this field contains the language the transform is for.

transform_type character_data

**Examples:**

Example 1 (unknown):
```unknown
udt_catalog
```

Example 2 (unknown):
```unknown
sql_identifier
```

Example 3 (unknown):
```unknown
sql_identifier
```

Example 4 (unknown):
```unknown
sql_identifier
```

---


---

