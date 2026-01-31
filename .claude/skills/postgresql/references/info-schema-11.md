# PostgreSQL - Info Schema (Part 11)

## 35.31. foreign_tables #


**URL:** https://www.postgresql.org/docs/18/infoschema-foreign-tables.html

**Contents:**
- 35.31. foreign_tables #

The view foreign_tables contains all foreign tables defined in the current database. Only those foreign tables are shown that the current user has access to (by way of being the owner or having some privilege).

Table 35.29. foreign_tables Columns

foreign_table_catalog sql_identifier

Name of the database that the foreign table is defined in (always the current database)

foreign_table_schema sql_identifier

Name of the schema that contains the foreign table

foreign_table_name sql_identifier

Name of the foreign table

foreign_server_catalog sql_identifier

Name of the database that the foreign server is defined in (always the current database)

foreign_server_name sql_identifier

Name of the foreign server

**Examples:**

Example 1 (unknown):
```unknown
foreign_tables
```

Example 2 (unknown):
```unknown
foreign_tables
```

Example 3 (unknown):
```unknown
foreign_tables
```

Example 4 (unknown):
```unknown
foreign_tables
```

---


---

## 35.34. referential_constraints #


**URL:** https://www.postgresql.org/docs/18/infoschema-referential-constraints.html

**Contents:**
- 35.34. referential_constraints #

The view referential_constraints contains all referential (foreign key) constraints in the current database. Only those constraints are shown for which the current user has write access to the referencing table (by way of being the owner or having some privilege other than SELECT).

Table 35.32. referential_constraints Columns

constraint_catalog sql_identifier

Name of the database containing the constraint (always the current database)

constraint_schema sql_identifier

Name of the schema containing the constraint

constraint_name sql_identifier

Name of the constraint

unique_constraint_catalog sql_identifier

Name of the database that contains the unique or primary key constraint that the foreign key constraint references (always the current database)

unique_constraint_schema sql_identifier

Name of the schema that contains the unique or primary key constraint that the foreign key constraint references

unique_constraint_name sql_identifier

Name of the unique or primary key constraint that the foreign key constraint references

match_option character_data

Match option of the foreign key constraint: FULL, PARTIAL, or NONE.

update_rule character_data

Update rule of the foreign key constraint: CASCADE, SET NULL, SET DEFAULT, RESTRICT, or NO ACTION.

delete_rule character_data

Delete rule of the foreign key constraint: CASCADE, SET NULL, SET DEFAULT, RESTRICT, or NO ACTION.

**Examples:**

Example 1 (unknown):
```unknown
referential_constraints
```

Example 2 (unknown):
```unknown
referential_constraints
```

Example 3 (unknown):
```unknown
referential_constraints
```

Example 4 (unknown):
```unknown
referential_constraints
```

---


---

## 35.47. sequences #


**URL:** https://www.postgresql.org/docs/18/infoschema-sequences.html

**Contents:**
- 35.47. sequences #

The view sequences contains all sequences defined in the current database. Only those sequences are shown that the current user has access to (by way of being the owner or having some privilege).

Table 35.45. sequences Columns

sequence_catalog sql_identifier

Name of the database that contains the sequence (always the current database)

sequence_schema sql_identifier

Name of the schema that contains the sequence

sequence_name sql_identifier

data_type character_data

The data type of the sequence.

numeric_precision cardinal_number

This column contains the (declared or implicit) precision of the sequence data type (see above). The precision indicates the number of significant digits. It can be expressed in decimal (base 10) or binary (base 2) terms, as specified in the column numeric_precision_radix.

numeric_precision_radix cardinal_number

This column indicates in which base the values in the columns numeric_precision and numeric_scale are expressed. The value is either 2 or 10.

numeric_scale cardinal_number

This column contains the (declared or implicit) scale of the sequence data type (see above). The scale indicates the number of significant digits to the right of the decimal point. It can be expressed in decimal (base 10) or binary (base 2) terms, as specified in the column numeric_precision_radix.

start_value character_data

The start value of the sequence

minimum_value character_data

The minimum value of the sequence

maximum_value character_data

The maximum value of the sequence

increment character_data

The increment of the sequence

cycle_option yes_or_no

YES if the sequence cycles, else NO

Note that in accordance with the SQL standard, the start, minimum, maximum, and increment values are returned as character strings.

**Examples:**

Example 1 (unknown):
```unknown
sequence_catalog
```

Example 2 (unknown):
```unknown
sql_identifier
```

Example 3 (unknown):
```unknown
sequence_schema
```

Example 4 (unknown):
```unknown
sql_identifier
```

---


---

## 35.51. sql_sizing #


**URL:** https://www.postgresql.org/docs/18/infoschema-sql-sizing.html

**Contents:**
- 35.51. sql_sizing #

The table sql_sizing contains information about various size limits and maximum values in PostgreSQL. This information is primarily intended for use in the context of the ODBC interface; users of other interfaces will probably find this information to be of little use. For this reason, the individual sizing items are not described here; you will find them in the description of the ODBC interface.

Table 35.49. sql_sizing Columns

sizing_id cardinal_number

Identifier of the sizing item

sizing_name character_data

Descriptive name of the sizing item

supported_value cardinal_number

Value of the sizing item, or 0 if the size is unlimited or cannot be determined, or null if the features for which the sizing item is applicable are not supported

comments character_data

Possibly a comment pertaining to the sizing item

**Examples:**

Example 1 (unknown):
```unknown
cardinal_number
```

Example 2 (unknown):
```unknown
sizing_name
```

Example 3 (unknown):
```unknown
character_data
```

Example 4 (unknown):
```unknown
supported_value
```

---


---

## 35.10. collations #


**URL:** https://www.postgresql.org/docs/18/infoschema-collations.html

**Contents:**
- 35.10. collations #

The view collations contains the collations available in the current database.

Table 35.8. collations Columns

collation_catalog sql_identifier

Name of the database containing the collation (always the current database)

collation_schema sql_identifier

Name of the schema containing the collation

collation_name sql_identifier

Name of the default collation

pad_attribute character_data

Always NO PAD (The alternative PAD SPACE is not supported by PostgreSQL.)

**Examples:**

Example 1 (unknown):
```unknown
collation_catalog
```

Example 2 (unknown):
```unknown
sql_identifier
```

Example 3 (unknown):
```unknown
collation_schema
```

Example 4 (unknown):
```unknown
sql_identifier
```

---


---

## 35.5. applicable_roles #


**URL:** https://www.postgresql.org/docs/18/infoschema-applicable-roles.html

**Contents:**
- 35.5. applicable_roles #

The view applicable_roles identifies all roles whose privileges the current user can use. This means there is some chain of role grants from the current user to the role in question. The current user itself is also an applicable role. The set of applicable roles is generally used for permission checking.

Table 35.3. applicable_roles Columns

grantee sql_identifier

Name of the role to which this role membership was granted (can be the current user, or a different role in case of nested role memberships)

role_name sql_identifier

is_grantable yes_or_no

YES if the grantee has the admin option on the role, NO if not

**Examples:**

Example 1 (unknown):
```unknown
applicable_roles
```

Example 2 (unknown):
```unknown
applicable_roles
```

Example 3 (unknown):
```unknown
applicable_roles
```

Example 4 (unknown):
```unknown
applicable_roles
```

---


---

