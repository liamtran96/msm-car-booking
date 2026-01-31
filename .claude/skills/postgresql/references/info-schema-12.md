# PostgreSQL - Info Schema (Part 12)

## 35.24. element_types #


**URL:** https://www.postgresql.org/docs/18/infoschema-element-types.html

**Contents:**
- 35.24. element_types #

The view element_types contains the data type descriptors of the elements of arrays. When a table column, composite-type attribute, domain, function parameter, or function return value is defined to be of an array type, the respective information schema view only contains ARRAY in the column data_type. To obtain information on the element type of the array, you can join the respective view with this view. For example, to show the columns of a table with data types and array element types, if applicable, you could do:

This view only includes objects that the current user has access to, by way of being the owner or having some privilege.

Table 35.22. element_types Columns

object_catalog sql_identifier

Name of the database that contains the object that uses the array being described (always the current database)

object_schema sql_identifier

Name of the schema that contains the object that uses the array being described

object_name sql_identifier

Name of the object that uses the array being described

object_type character_data

The type of the object that uses the array being described: one of TABLE (the array is used by a column of that table), USER-DEFINED TYPE (the array is used by an attribute of that composite type), DOMAIN (the array is used by that domain), ROUTINE (the array is used by a parameter or the return data type of that function).

collection_type_identifier sql_identifier

The identifier of the data type descriptor of the array being described. Use this to join with the dtd_identifier columns of other information schema views.

data_type character_data

Data type of the array elements, if it is a built-in type, else USER-DEFINED (in that case, the type is identified in udt_name and associated columns).

character_maximum_length cardinal_number

Always null, since this information is not applied to array element data types in PostgreSQL

character_octet_length cardinal_number

Always null, since this information is not applied to array element data types in PostgreSQL

character_set_catalog sql_identifier

Applies to a feature not available in PostgreSQL

character_set_schema sql_identifier

Applies to a feature not available in PostgreSQL

character_set_name sql_identifier

Applies to a feature not available in PostgreSQL

collation_catalog sql_identifier

Name of the database containing the collation of the element type (always the current database), null if default or the data type of the element is not collatable

collation_schema sql_identifier

Name of the schema containing the collation of the element type, null if default or the data type of the element is not collatable

collation_name sql_identifier

Name of the collation of the element type, null if default or the data type of the element is not collatable

numeric_precision cardinal_number

Always null, since this information is not applied to array element data types in PostgreSQL

numeric_precision_radix cardinal_number

Always null, since this information is not applied to array element data types in PostgreSQL

numeric_scale cardinal_number

Always null, since this information is not applied to array element data types in PostgreSQL

datetime_precision cardinal_number

Always null, since this information is not applied to array element data types in PostgreSQL

interval_type character_data

Always null, since this information is not applied to array element data types in PostgreSQL

interval_precision cardinal_number

Always null, since this information is not applied to array element data types in PostgreSQL

udt_catalog sql_identifier

Name of the database that the data type of the elements is defined in (always the current database)

udt_schema sql_identifier

Name of the schema that the data type of the elements is defined in

udt_name sql_identifier

Name of the data type of the elements

scope_catalog sql_identifier

Applies to a feature not available in PostgreSQL

scope_schema sql_identifier

Applies to a feature not available in PostgreSQL

scope_name sql_identifier

Applies to a feature not available in PostgreSQL

maximum_cardinality cardinal_number

Always null, because arrays always have unlimited maximum cardinality in PostgreSQL

dtd_identifier sql_identifier

An identifier of the data type descriptor of the element. This is currently not useful.

**Examples:**

Example 1 (unknown):
```unknown
element_types
```

Example 2 (unknown):
```unknown
element_types
```

Example 3 (unknown):
```unknown
element_types
```

Example 4 (sql):
```sql
SELECT c.column_name, c.data_type, e.data_type AS element_type
FROM information_schema.columns c LEFT JOIN information_schema.element_types e
     ON ((c.table_catalog, c.table_schema, c.table_name, 'TABLE', c.dtd_identifier)
       = (e.object_catalog, e.object_schema, e.object_name, e.object_type, e.collection_type_identifier))
WHERE c.table_schema = '...' AND c.table_name = '...'
ORDER BY c.ordinal_position;
```

---


---

## 35.20. data_type_privileges #


**URL:** https://www.postgresql.org/docs/18/infoschema-data-type-privileges.html

**Contents:**
- 35.20. data_type_privileges #

The view data_type_privileges identifies all data type descriptors that the current user has access to, by way of being the owner of the described object or having some privilege for it. A data type descriptor is generated whenever a data type is used in the definition of a table column, a domain, or a function (as parameter or return type) and stores some information about how the data type is used in that instance (for example, the declared maximum length, if applicable). Each data type descriptor is assigned an arbitrary identifier that is unique among the data type descriptor identifiers assigned for one object (table, domain, function). This view is probably not useful for applications, but it is used to define some other views in the information schema.

Table 35.18. data_type_privileges Columns

object_catalog sql_identifier

Name of the database that contains the described object (always the current database)

object_schema sql_identifier

Name of the schema that contains the described object

object_name sql_identifier

Name of the described object

object_type character_data

The type of the described object: one of TABLE (the data type descriptor pertains to a column of that table), DOMAIN (the data type descriptors pertains to that domain), ROUTINE (the data type descriptor pertains to a parameter or the return data type of that function).

dtd_identifier sql_identifier

The identifier of the data type descriptor, which is unique among the data type descriptors for that same object.

**Examples:**

Example 1 (unknown):
```unknown
data_type_privileges
```

Example 2 (unknown):
```unknown
data_type_privileges
```

Example 3 (unknown):
```unknown
data_type_privileges
```

Example 4 (unknown):
```unknown
data_type_privileges
```

---


---

## 35.36. role_routine_grants #


**URL:** https://www.postgresql.org/docs/18/infoschema-role-routine-grants.html

**Contents:**
- 35.36. role_routine_grants #

The view role_routine_grants identifies all privileges granted on functions where the grantor or grantee is a currently enabled role. Further information can be found under routine_privileges. The only effective difference between this view and routine_privileges is that this view omits functions that have been made accessible to the current user by way of a grant to PUBLIC.

Table 35.34. role_routine_grants Columns

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
role_routine_grants
```

Example 2 (unknown):
```unknown
role_routine_grants
```

Example 3 (unknown):
```unknown
role_routine_grants
```

Example 4 (unknown):
```unknown
routine_privileges
```

---


---

## 35.1. The Schema #


**URL:** https://www.postgresql.org/docs/18/infoschema-schema.html

**Contents:**
- 35.1. The Schema #

The information schema itself is a schema named information_schema. This schema automatically exists in all databases. The owner of this schema is the initial database user in the cluster, and that user naturally has all the privileges on this schema, including the ability to drop it (but the space savings achieved by that are minuscule).

By default, the information schema is not in the schema search path, so you need to access all objects in it through qualified names. Since the names of some of the objects in the information schema are generic names that might occur in user applications, you should be careful if you want to put the information schema in the path.

**Examples:**

Example 1 (unknown):
```unknown
information_schema
```

---


---

