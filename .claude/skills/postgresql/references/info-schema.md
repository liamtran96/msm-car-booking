# PostgreSQL - Info Schema

## 35.2. Data Types #


**URL:** https://www.postgresql.org/docs/18/infoschema-datatypes.html

**Contents:**
- 35.2. Data Types #

The columns of the information schema views use special data types that are defined in the information schema. These are defined as simple domains over ordinary built-in types. You should not use these types for work outside the information schema, but your applications must be prepared for them if they select from the information schema.

A nonnegative integer.

A character string (without specific maximum length).

A character string. This type is used for SQL identifiers, the type character_data is used for any other kind of text data.

A domain over the type timestamp with time zone

A character string domain that contains either YES or NO. This is used to represent Boolean (true/false) data in the information schema. (The information schema was invented before the type boolean was added to the SQL standard, so this convention is necessary to keep the information schema backward compatible.)

Every column in the information schema has one of these five types.

**Examples:**

Example 1 (unknown):
```unknown
cardinal_number
```

Example 2 (unknown):
```unknown
character_data
```

Example 3 (unknown):
```unknown
sql_identifier
```

Example 4 (unknown):
```unknown
character_data
```

---


---

## Chapter 35. The Information Schema


**URL:** https://www.postgresql.org/docs/18/information-schema.html

**Contents:**
- Chapter 35. The Information Schema
  - Note

The information schema consists of a set of views that contain information about the objects defined in the current database. The information schema is defined in the SQL standard and can therefore be expected to be portable and remain stable — unlike the system catalogs, which are specific to PostgreSQL and are modeled after implementation concerns. The information schema views do not, however, contain information about PostgreSQL-specific features; to inquire about those you need to query the system catalogs or other PostgreSQL-specific views.

When querying the database for constraint information, it is possible for a standard-compliant query that expects to return one row to return several. This is because the SQL standard requires constraint names to be unique within a schema, but PostgreSQL does not enforce this restriction. PostgreSQL automatically-generated constraint names avoid duplicates in the same schema, but users can specify such duplicate names.

This problem can appear when querying information schema views such as check_constraint_routine_usage, check_constraints, domain_constraints, and referential_constraints. Some other views have similar issues but contain the table name to help distinguish duplicate rows, e.g., constraint_column_usage, constraint_table_usage, table_constraints.

**Examples:**

Example 1 (unknown):
```unknown
information_schema_catalog_name
```

Example 2 (unknown):
```unknown
administrable_role_​authorizations
```

Example 3 (unknown):
```unknown
applicable_roles
```

Example 4 (unknown):
```unknown
character_sets
```

---


---

## 35.41. routine_privileges #


**URL:** https://www.postgresql.org/docs/18/infoschema-routine-privileges.html

**Contents:**
- 35.41. routine_privileges #

The view routine_privileges identifies all privileges granted on functions to a currently enabled role or by a currently enabled role. There is one row for each combination of function, grantor, and grantee.

Table 35.39. routine_privileges Columns

grantor sql_identifier

Name of the role that granted the privilege

grantee sql_identifier

Name of the role that the privilege was granted to

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

privilege_type character_data

Always EXECUTE (the only privilege type for functions)

is_grantable yes_or_no

YES if the privilege is grantable, NO if not

**Examples:**

Example 1 (unknown):
```unknown
routine_privileges
```

Example 2 (unknown):
```unknown
routine_privileges
```

Example 3 (unknown):
```unknown
routine_privileges
```

Example 4 (unknown):
```unknown
routine_privileges
```

---


---

## 35.27. foreign_data_wrappers #


**URL:** https://www.postgresql.org/docs/18/infoschema-foreign-data-wrappers.html

**Contents:**
- 35.27. foreign_data_wrappers #

The view foreign_data_wrappers contains all foreign-data wrappers defined in the current database. Only those foreign-data wrappers are shown that the current user has access to (by way of being the owner or having some privilege).

Table 35.25. foreign_data_wrappers Columns

foreign_data_wrapper_catalog sql_identifier

Name of the database that contains the foreign-data wrapper (always the current database)

foreign_data_wrapper_name sql_identifier

Name of the foreign-data wrapper

authorization_identifier sql_identifier

Name of the owner of the foreign server

library_name character_data

File name of the library that implementing this foreign-data wrapper

foreign_data_wrapper_language character_data

Language used to implement this foreign-data wrapper

**Examples:**

Example 1 (unknown):
```unknown
foreign_data_wrappers
```

Example 2 (unknown):
```unknown
foreign_data_wrappers
```

Example 3 (unknown):
```unknown
foreign_data_wrappers
```

Example 4 (unknown):
```unknown
foreign_data_wrappers
```

---


---

## 35.7. character_sets #


**URL:** https://www.postgresql.org/docs/18/infoschema-character-sets.html

**Contents:**
- 35.7. character_sets #

The view character_sets identifies the character sets available in the current database. Since PostgreSQL does not support multiple character sets within one database, this view only shows one, which is the database encoding.

Take note of how the following terms are used in the SQL standard:

An abstract collection of characters, for example UNICODE, UCS, or LATIN1. Not exposed as an SQL object, but visible in this view.

An encoding of some character repertoire. Most older character repertoires only use one encoding form, and so there are no separate names for them (e.g., LATIN2 is an encoding form applicable to the LATIN2 repertoire). But for example Unicode has the encoding forms UTF8, UTF16, etc. (not all supported by PostgreSQL). Encoding forms are not exposed as an SQL object, but are visible in this view.

A named SQL object that identifies a character repertoire, a character encoding, and a default collation. A predefined character set would typically have the same name as an encoding form, but users could define other names. For example, the character set UTF8 would typically identify the character repertoire UCS, encoding form UTF8, and some default collation.

You can think of an “encoding” in PostgreSQL either as a character set or a character encoding form. They will have the same name, and there can only be one in one database.

Table 35.5. character_sets Columns

character_set_catalog sql_identifier

Character sets are currently not implemented as schema objects, so this column is null.

character_set_schema sql_identifier

Character sets are currently not implemented as schema objects, so this column is null.

character_set_name sql_identifier

Name of the character set, currently implemented as showing the name of the database encoding

character_repertoire sql_identifier

Character repertoire, showing UCS if the encoding is UTF8, else just the encoding name

form_of_use sql_identifier

Character encoding form, same as the database encoding

default_collate_catalog sql_identifier

Name of the database containing the default collation (always the current database, if any collation is identified)

default_collate_schema sql_identifier

Name of the schema containing the default collation

default_collate_name sql_identifier

Name of the default collation. The default collation is identified as the collation that matches the COLLATE and CTYPE settings of the current database. If there is no such collation, then this column and the associated schema and catalog columns are null.

**Examples:**

Example 1 (unknown):
```unknown
character_sets
```

Example 2 (unknown):
```unknown
character_sets
```

Example 3 (unknown):
```unknown
character_sets
```

Example 4 (unknown):
```unknown
character_sets
```

---


---

