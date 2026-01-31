# PostgreSQL - Info Schema (Part 3)

## 35.9. check_constraints #


**URL:** https://www.postgresql.org/docs/18/infoschema-check-constraints.html

**Contents:**
- 35.9. check_constraints #

The view check_constraints contains all check constraints, either defined on a table or on a domain, that are owned by a currently enabled role. (The owner of the table or domain is the owner of the constraint.)

The SQL standard considers not-null constraints to be check constraints with a CHECK (column_name IS NOT NULL) expression. So not-null constraints are also included here and don't have a separate view.

Table 35.7. check_constraints Columns

constraint_catalog sql_identifier

Name of the database containing the constraint (always the current database)

constraint_schema sql_identifier

Name of the schema containing the constraint

constraint_name sql_identifier

Name of the constraint

check_clause character_data

The check expression of the check constraint

**Examples:**

Example 1 (unknown):
```unknown
check_constraints
```

Example 2 (unknown):
```unknown
check_constraints
```

Example 3 (unknown):
```unknown
check_constraints
```

Example 4 (unknown):
```unknown
CHECK (column_name IS NOT NULL)
```

---


---

## 35.49. sql_implementation_info #


**URL:** https://www.postgresql.org/docs/18/infoschema-sql-implementation-info.html

**Contents:**
- 35.49. sql_implementation_info #

The table sql_implementation_info contains information about various aspects that are left implementation-defined by the SQL standard. This information is primarily intended for use in the context of the ODBC interface; users of other interfaces will probably find this information to be of little use. For this reason, the individual implementation information items are not described here; you will find them in the description of the ODBC interface.

Table 35.47. sql_implementation_info Columns

implementation_info_id character_data

Identifier string of the implementation information item

implementation_info_name character_data

Descriptive name of the implementation information item

integer_value cardinal_number

Value of the implementation information item, or null if the value is contained in the column character_value

character_value character_data

Value of the implementation information item, or null if the value is contained in the column integer_value

comments character_data

Possibly a comment pertaining to the implementation information item

**Examples:**

Example 1 (unknown):
```unknown
sql_implementation_info
```

Example 2 (unknown):
```unknown
sql_implementation_info
```

Example 3 (unknown):
```unknown
sql_implementation_info
```

Example 4 (unknown):
```unknown
sql_implementation_info
```

---


---

## 35.12. column_column_usage #


**URL:** https://www.postgresql.org/docs/18/infoschema-column-column-usage.html

**Contents:**
- 35.12. column_column_usage #

The view column_column_usage identifies all generated columns that depend on another base column in the same table. Only tables owned by a currently enabled role are included.

Table 35.10. column_column_usage Columns

table_catalog sql_identifier

Name of the database containing the table (always the current database)

table_schema sql_identifier

Name of the schema containing the table

table_name sql_identifier

column_name sql_identifier

Name of the base column that a generated column depends on

dependent_column sql_identifier

Name of the generated column

**Examples:**

Example 1 (unknown):
```unknown
column_column_usage
```

Example 2 (unknown):
```unknown
column_column_usage
```

Example 3 (unknown):
```unknown
column_column_usage
```

Example 4 (unknown):
```unknown
column_column_usage
```

---


---

## 35.66. views #


**URL:** https://www.postgresql.org/docs/18/infoschema-views.html

**Contents:**
- 35.66. views #

The view views contains all views defined in the current database. Only those views are shown that the current user has access to (by way of being the owner or having some privilege).

Table 35.64. views Columns

table_catalog sql_identifier

Name of the database that contains the view (always the current database)

table_schema sql_identifier

Name of the schema that contains the view

table_name sql_identifier

view_definition character_data

Query expression defining the view (null if the view is not owned by a currently enabled role)

check_option character_data

CASCADED or LOCAL if the view has a CHECK OPTION defined on it, NONE if not

is_updatable yes_or_no

YES if the view is updatable (allows UPDATE and DELETE), NO if not

is_insertable_into yes_or_no

YES if the view is insertable into (allows INSERT), NO if not

is_trigger_updatable yes_or_no

YES if the view has an INSTEAD OF UPDATE trigger defined on it, NO if not

is_trigger_deletable yes_or_no

YES if the view has an INSTEAD OF DELETE trigger defined on it, NO if not

is_trigger_insertable_into yes_or_no

YES if the view has an INSTEAD OF INSERT trigger defined on it, NO if not

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

## 35.53. table_privileges #


**URL:** https://www.postgresql.org/docs/18/infoschema-table-privileges.html

**Contents:**
- 35.53. table_privileges #

The view table_privileges identifies all privileges granted on tables or views to a currently enabled role or by a currently enabled role. There is one row for each combination of table, grantor, and grantee.

Table 35.51. table_privileges Columns

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
table_privileges
```

Example 2 (unknown):
```unknown
table_privileges
```

Example 3 (unknown):
```unknown
table_privileges
```

Example 4 (unknown):
```unknown
table_privileges
```

---


---

## 35.11. collation_character_set_​applicability #


**URL:** https://www.postgresql.org/docs/18/infoschema-collation-character-set-applicab.html

**Contents:**
- 35.11. collation_character_set_​applicability #

The view collation_character_set_applicability identifies which character set the available collations are applicable to. In PostgreSQL, there is only one character set per database (see explanation in Section 35.7), so this view does not provide much useful information.

Table 35.9. collation_character_set_applicability Columns

collation_catalog sql_identifier

Name of the database containing the collation (always the current database)

collation_schema sql_identifier

Name of the schema containing the collation

collation_name sql_identifier

Name of the default collation

character_set_catalog sql_identifier

Character sets are currently not implemented as schema objects, so this column is null

character_set_schema sql_identifier

Character sets are currently not implemented as schema objects, so this column is null

character_set_name sql_identifier

Name of the character set

**Examples:**

Example 1 (unknown):
```unknown
collation_character_set_​applicability
```

Example 2 (unknown):
```unknown
collation_character_set_​applicability
```

Example 3 (unknown):
```unknown
collation_character_set_applicability
```

Example 4 (unknown):
```unknown
collation_character_set_applicability
```

---


---

