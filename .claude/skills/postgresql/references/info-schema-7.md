# PostgreSQL - Info Schema (Part 7)

## 35.46. schemata #


**URL:** https://www.postgresql.org/docs/18/infoschema-schemata.html

**Contents:**
- 35.46. schemata #

The view schemata contains all schemas in the current database that the current user has access to (by way of being the owner or having some privilege).

Table 35.44. schemata Columns

catalog_name sql_identifier

Name of the database that the schema is contained in (always the current database)

schema_name sql_identifier

schema_owner sql_identifier

Name of the owner of the schema

default_character_set_catalog sql_identifier

Applies to a feature not available in PostgreSQL

default_character_set_schema sql_identifier

Applies to a feature not available in PostgreSQL

default_character_set_name sql_identifier

Applies to a feature not available in PostgreSQL

sql_path character_data

Applies to a feature not available in PostgreSQL

**Examples:**

Example 1 (unknown):
```unknown
catalog_name
```

Example 2 (unknown):
```unknown
sql_identifier
```

Example 3 (unknown):
```unknown
schema_name
```

Example 4 (unknown):
```unknown
sql_identifier
```

---


---

## 35.44. routine_table_usage #


**URL:** https://www.postgresql.org/docs/18/infoschema-routine-table-usage.html

**Contents:**
- 35.44. routine_table_usage #

The view routine_table_usage is meant to identify all tables that are used by a function or procedure. This information is currently not tracked by PostgreSQL.

Table 35.42. routine_table_usage Columns

specific_catalog sql_identifier

Name of the database containing the function (always the current database)

specific_schema sql_identifier

Name of the schema containing the function

specific_name sql_identifier

The “specific name” of the function. See Section 35.45 for more information.

routine_catalog sql_identifier

Name of the database containing the function (always the current database)

routine_schema sql_identifier

Name of the schema containing the function

routine_name sql_identifier

Name of the function (might be duplicated in case of overloading)

table_catalog sql_identifier

Name of the database that contains the table that is used by the function (always the current database)

table_schema sql_identifier

Name of the schema that contains the table that is used by the function

table_name sql_identifier

Name of the table that is used by the function

**Examples:**

Example 1 (unknown):
```unknown
routine_table_usage
```

Example 2 (unknown):
```unknown
routine_table_usage
```

Example 3 (unknown):
```unknown
routine_table_usage
```

Example 4 (unknown):
```unknown
routine_table_usage
```

---


---

## 35.35. role_column_grants #


**URL:** https://www.postgresql.org/docs/18/infoschema-role-column-grants.html

**Contents:**
- 35.35. role_column_grants #

The view role_column_grants identifies all privileges granted on columns where the grantor or grantee is a currently enabled role. Further information can be found under column_privileges. The only effective difference between this view and column_privileges is that this view omits columns that have been made accessible to the current user by way of a grant to PUBLIC.

Table 35.33. role_column_grants Columns

grantor sql_identifier

Name of the role that granted the privilege

grantee sql_identifier

Name of the role that the privilege was granted to

table_catalog sql_identifier

Name of the database that contains the table that contains the column (always the current database)

table_schema sql_identifier

Name of the schema that contains the table that contains the column

table_name sql_identifier

Name of the table that contains the column

column_name sql_identifier

privilege_type character_data

Type of the privilege: SELECT, INSERT, UPDATE, or REFERENCES

is_grantable yes_or_no

YES if the privilege is grantable, NO if not

**Examples:**

Example 1 (unknown):
```unknown
role_column_grants
```

Example 2 (unknown):
```unknown
role_column_grants
```

Example 3 (unknown):
```unknown
role_column_grants
```

Example 4 (unknown):
```unknown
column_privileges
```

---


---

## 35.4. administrable_role_​authorizations #


**URL:** https://www.postgresql.org/docs/18/infoschema-administrable-role-authorizations.html

**Contents:**
- 35.4. administrable_role_​authorizations #

The view administrable_role_authorizations identifies all roles that the current user has the admin option for.

Table 35.2. administrable_role_authorizations Columns

grantee sql_identifier

Name of the role to which this role membership was granted (can be the current user, or a different role in case of nested role memberships)

role_name sql_identifier

is_grantable yes_or_no

**Examples:**

Example 1 (unknown):
```unknown
administrable_role_​authorizations
```

Example 2 (unknown):
```unknown
administrable_role_​authorizations
```

Example 3 (unknown):
```unknown
administrable_role_authorizations
```

Example 4 (unknown):
```unknown
administrable_role_authorizations
```

---


---

## 35.14. column_options #


**URL:** https://www.postgresql.org/docs/18/infoschema-column-options.html

**Contents:**
- 35.14. column_options #

The view column_options contains all the options defined for foreign table columns in the current database. Only those foreign table columns are shown that the current user has access to (by way of being the owner or having some privilege).

Table 35.12. column_options Columns

table_catalog sql_identifier

Name of the database that contains the foreign table (always the current database)

table_schema sql_identifier

Name of the schema that contains the foreign table

table_name sql_identifier

Name of the foreign table

column_name sql_identifier

option_name sql_identifier

option_value character_data

**Examples:**

Example 1 (unknown):
```unknown
column_options
```

Example 2 (unknown):
```unknown
column_options
```

Example 3 (unknown):
```unknown
column_options
```

Example 4 (unknown):
```unknown
column_options
```

---


---

## 35.48. sql_features #


**URL:** https://www.postgresql.org/docs/18/infoschema-sql-features.html

**Contents:**
- 35.48. sql_features #

The table sql_features contains information about which formal features defined in the SQL standard are supported by PostgreSQL. This is the same information that is presented in Appendix D. There you can also find some additional background information.

Table 35.46. sql_features Columns

feature_id character_data

Identifier string of the feature

feature_name character_data

Descriptive name of the feature

sub_feature_id character_data

Identifier string of the subfeature, or a zero-length string if not a subfeature

sub_feature_name character_data

Descriptive name of the subfeature, or a zero-length string if not a subfeature

is_supported yes_or_no

YES if the feature is fully supported by the current version of PostgreSQL, NO if not

is_verified_by character_data

Always null, since the PostgreSQL development group does not perform formal testing of feature conformance

comments character_data

Possibly a comment about the supported status of the feature

**Examples:**

Example 1 (unknown):
```unknown
sql_features
```

Example 2 (unknown):
```unknown
sql_features
```

Example 3 (unknown):
```unknown
sql_features
```

Example 4 (unknown):
```unknown
sql_features
```

---


---

