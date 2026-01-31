# PostgreSQL - Info Schema (Part 15)

## 35.16. column_udt_usage #


**URL:** https://www.postgresql.org/docs/18/infoschema-column-udt-usage.html

**Contents:**
- 35.16. column_udt_usage #

The view column_udt_usage identifies all columns that use data types owned by a currently enabled role. Note that in PostgreSQL, built-in data types behave like user-defined types, so they are included here as well. See also Section 35.17 for details.

Table 35.14. column_udt_usage Columns

udt_catalog sql_identifier

Name of the database that the column data type (the underlying type of the domain, if applicable) is defined in (always the current database)

udt_schema sql_identifier

Name of the schema that the column data type (the underlying type of the domain, if applicable) is defined in

udt_name sql_identifier

Name of the column data type (the underlying type of the domain, if applicable)

table_catalog sql_identifier

Name of the database containing the table (always the current database)

table_schema sql_identifier

Name of the schema containing the table

table_name sql_identifier

column_name sql_identifier

**Examples:**

Example 1 (unknown):
```unknown
column_udt_usage
```

Example 2 (unknown):
```unknown
column_udt_usage
```

Example 3 (unknown):
```unknown
column_udt_usage
```

Example 4 (unknown):
```unknown
column_udt_usage
```

---


---

## 35.65. view_table_usage #


**URL:** https://www.postgresql.org/docs/18/infoschema-view-table-usage.html

**Contents:**
- 35.65. view_table_usage #
  - Note

The view view_table_usage identifies all tables that are used in the query expression of a view (the SELECT statement that defines the view). A table is only included if that table is owned by a currently enabled role.

System tables are not included. This should be fixed sometime.

Table 35.63. view_table_usage Columns

view_catalog sql_identifier

Name of the database that contains the view (always the current database)

view_schema sql_identifier

Name of the schema that contains the view

view_name sql_identifier

table_catalog sql_identifier

Name of the database that contains the table that is used by the view (always the current database)

table_schema sql_identifier

Name of the schema that contains the table that is used by the view

table_name sql_identifier

Name of the table that is used by the view

**Examples:**

Example 1 (unknown):
```unknown
view_table_usage
```

Example 2 (unknown):
```unknown
view_table_usage
```

Example 3 (unknown):
```unknown
view_table_usage
```

Example 4 (unknown):
```unknown
view_table_usage
```

---


---

## 35.22. domain_udt_usage #


**URL:** https://www.postgresql.org/docs/18/infoschema-domain-udt-usage.html

**Contents:**
- 35.22. domain_udt_usage #

The view domain_udt_usage identifies all domains that are based on data types owned by a currently enabled role. Note that in PostgreSQL, built-in data types behave like user-defined types, so they are included here as well.

Table 35.20. domain_udt_usage Columns

udt_catalog sql_identifier

Name of the database that the domain data type is defined in (always the current database)

udt_schema sql_identifier

Name of the schema that the domain data type is defined in

udt_name sql_identifier

Name of the domain data type

domain_catalog sql_identifier

Name of the database that contains the domain (always the current database)

domain_schema sql_identifier

Name of the schema that contains the domain

domain_name sql_identifier

**Examples:**

Example 1 (unknown):
```unknown
domain_udt_usage
```

Example 2 (unknown):
```unknown
domain_udt_usage
```

Example 3 (unknown):
```unknown
domain_udt_usage
```

Example 4 (unknown):
```unknown
domain_udt_usage
```

---


---

