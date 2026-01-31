# PostgreSQL - Info Schema (Part 4)

## 35.15. column_privileges #


**URL:** https://www.postgresql.org/docs/18/infoschema-column-privileges.html

**Contents:**
- 35.15. column_privileges #

The view column_privileges identifies all privileges granted on columns to a currently enabled role or by a currently enabled role. There is one row for each combination of column, grantor, and grantee.

If a privilege has been granted on an entire table, it will show up in this view as a grant for each column, but only for the privilege types where column granularity is possible: SELECT, INSERT, UPDATE, REFERENCES.

Table 35.13. column_privileges Columns

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
column_privileges
```

Example 2 (unknown):
```unknown
column_privileges
```

Example 3 (unknown):
```unknown
column_privileges
```

Example 4 (unknown):
```unknown
column_privileges
```

---


---

## 35.40. routine_column_usage #


**URL:** https://www.postgresql.org/docs/18/infoschema-routine-column-usage.html

**Contents:**
- 35.40. routine_column_usage #

The view routine_column_usage identifies all columns that are used by a function or procedure, either in the SQL body or in parameter default expressions. (This only works for unquoted SQL bodies, not quoted bodies or functions in other languages.) A column is only included if its table is owned by a currently enabled role.

Table 35.38. routine_column_usage Columns

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

column_name sql_identifier

Name of the column that is used by the function

**Examples:**

Example 1 (unknown):
```unknown
routine_column_usage
```

Example 2 (unknown):
```unknown
routine_column_usage
```

Example 3 (unknown):
```unknown
routine_column_usage
```

Example 4 (unknown):
```unknown
routine_column_usage
```

---


---

## 35.62. user_mappings #


**URL:** https://www.postgresql.org/docs/18/infoschema-user-mappings.html

**Contents:**
- 35.62. user_mappings #

The view user_mappings contains all user mappings defined in the current database. Only those user mappings are shown where the current user has access to the corresponding foreign server (by way of being the owner or having some privilege).

Table 35.60. user_mappings Columns

authorization_identifier sql_identifier

Name of the user being mapped, or PUBLIC if the mapping is public

foreign_server_catalog sql_identifier

Name of the database that the foreign server used by this mapping is defined in (always the current database)

foreign_server_name sql_identifier

Name of the foreign server used by this mapping

**Examples:**

Example 1 (unknown):
```unknown
user_mappings
```

Example 2 (unknown):
```unknown
user_mappings
```

Example 3 (unknown):
```unknown
user_mappings
```

Example 4 (unknown):
```unknown
user_mappings
```

---


---

## 35.33. parameters #


**URL:** https://www.postgresql.org/docs/18/infoschema-parameters.html

**Contents:**
- 35.33. parameters #

The view parameters contains information about the parameters (arguments) of all functions in the current database. Only those functions are shown that the current user has access to (by way of being the owner or having some privilege).

Table 35.31. parameters Columns

specific_catalog sql_identifier

Name of the database containing the function (always the current database)

specific_schema sql_identifier

Name of the schema containing the function

specific_name sql_identifier

The “specific name” of the function. See Section 35.45 for more information.

ordinal_position cardinal_number

Ordinal position of the parameter in the argument list of the function (count starts at 1)

parameter_mode character_data

IN for input parameter, OUT for output parameter, and INOUT for input/output parameter.

Applies to a feature not available in PostgreSQL

Applies to a feature not available in PostgreSQL

parameter_name sql_identifier

Name of the parameter, or null if the parameter has no name

data_type character_data

Data type of the parameter, if it is a built-in type, or ARRAY if it is some array (in that case, see the view element_types), else USER-DEFINED (in that case, the type is identified in udt_name and associated columns).

character_maximum_length cardinal_number

Always null, since this information is not applied to parameter data types in PostgreSQL

character_octet_length cardinal_number

Always null, since this information is not applied to parameter data types in PostgreSQL

character_set_catalog sql_identifier

Applies to a feature not available in PostgreSQL

character_set_schema sql_identifier

Applies to a feature not available in PostgreSQL

character_set_name sql_identifier

Applies to a feature not available in PostgreSQL

collation_catalog sql_identifier

Always null, since this information is not applied to parameter data types in PostgreSQL

collation_schema sql_identifier

Always null, since this information is not applied to parameter data types in PostgreSQL

collation_name sql_identifier

Always null, since this information is not applied to parameter data types in PostgreSQL

numeric_precision cardinal_number

Always null, since this information is not applied to parameter data types in PostgreSQL

numeric_precision_radix cardinal_number

Always null, since this information is not applied to parameter data types in PostgreSQL

numeric_scale cardinal_number

Always null, since this information is not applied to parameter data types in PostgreSQL

datetime_precision cardinal_number

Always null, since this information is not applied to parameter data types in PostgreSQL

interval_type character_data

Always null, since this information is not applied to parameter data types in PostgreSQL

interval_precision cardinal_number

Always null, since this information is not applied to parameter data types in PostgreSQL

udt_catalog sql_identifier

Name of the database that the data type of the parameter is defined in (always the current database)

udt_schema sql_identifier

Name of the schema that the data type of the parameter is defined in

udt_name sql_identifier

Name of the data type of the parameter

scope_catalog sql_identifier

Applies to a feature not available in PostgreSQL

scope_schema sql_identifier

Applies to a feature not available in PostgreSQL

scope_name sql_identifier

Applies to a feature not available in PostgreSQL

maximum_cardinality cardinal_number

Always null, because arrays always have unlimited maximum cardinality in PostgreSQL

dtd_identifier sql_identifier

An identifier of the data type descriptor of the parameter, unique among the data type descriptors pertaining to the function. This is mainly useful for joining with other instances of such identifiers. (The specific format of the identifier is not defined and not guaranteed to remain the same in future versions.)

parameter_default character_data

The default expression of the parameter, or null if none or if the function is not owned by a currently enabled role.

**Examples:**

Example 1 (unknown):
```unknown
specific_catalog
```

Example 2 (unknown):
```unknown
sql_identifier
```

Example 3 (unknown):
```unknown
specific_schema
```

Example 4 (unknown):
```unknown
sql_identifier
```

---


---

