# PostgreSQL - Info Schema (Part 2)

## 35.6. attributes #


**URL:** https://www.postgresql.org/docs/18/infoschema-attributes.html

**Contents:**
- 35.6. attributes #

The view attributes contains information about the attributes of composite data types defined in the database. (Note that the view does not give information about table columns, which are sometimes called attributes in PostgreSQL contexts.) Only those attributes are shown that the current user has access to (by way of being the owner of or having some privilege on the type).

Table 35.4. attributes Columns

udt_catalog sql_identifier

Name of the database containing the data type (always the current database)

udt_schema sql_identifier

Name of the schema containing the data type

udt_name sql_identifier

Name of the data type

attribute_name sql_identifier

Name of the attribute

ordinal_position cardinal_number

Ordinal position of the attribute within the data type (count starts at 1)

attribute_default character_data

Default expression of the attribute

is_nullable yes_or_no

YES if the attribute is possibly nullable, NO if it is known not nullable.

data_type character_data

Data type of the attribute, if it is a built-in type, or ARRAY if it is some array (in that case, see the view element_types), else USER-DEFINED (in that case, the type is identified in attribute_udt_name and associated columns).

character_maximum_length cardinal_number

If data_type identifies a character or bit string type, the declared maximum length; null for all other data types or if no maximum length was declared.

character_octet_length cardinal_number

If data_type identifies a character type, the maximum possible length in octets (bytes) of a datum; null for all other data types. The maximum octet length depends on the declared character maximum length (see above) and the server encoding.

character_set_catalog sql_identifier

Applies to a feature not available in PostgreSQL

character_set_schema sql_identifier

Applies to a feature not available in PostgreSQL

character_set_name sql_identifier

Applies to a feature not available in PostgreSQL

collation_catalog sql_identifier

Name of the database containing the collation of the attribute (always the current database), null if default or the data type of the attribute is not collatable

collation_schema sql_identifier

Name of the schema containing the collation of the attribute, null if default or the data type of the attribute is not collatable

collation_name sql_identifier

Name of the collation of the attribute, null if default or the data type of the attribute is not collatable

numeric_precision cardinal_number

If data_type identifies a numeric type, this column contains the (declared or implicit) precision of the type for this attribute. The precision indicates the number of significant digits. It can be expressed in decimal (base 10) or binary (base 2) terms, as specified in the column numeric_precision_radix. For all other data types, this column is null.

numeric_precision_radix cardinal_number

If data_type identifies a numeric type, this column indicates in which base the values in the columns numeric_precision and numeric_scale are expressed. The value is either 2 or 10. For all other data types, this column is null.

numeric_scale cardinal_number

If data_type identifies an exact numeric type, this column contains the (declared or implicit) scale of the type for this attribute. The scale indicates the number of significant digits to the right of the decimal point. It can be expressed in decimal (base 10) or binary (base 2) terms, as specified in the column numeric_precision_radix. For all other data types, this column is null.

datetime_precision cardinal_number

If data_type identifies a date, time, timestamp, or interval type, this column contains the (declared or implicit) fractional seconds precision of the type for this attribute, that is, the number of decimal digits maintained following the decimal point in the seconds value. For all other data types, this column is null.

interval_type character_data

If data_type identifies an interval type, this column contains the specification which fields the intervals include for this attribute, e.g., YEAR TO MONTH, DAY TO SECOND, etc. If no field restrictions were specified (that is, the interval accepts all fields), and for all other data types, this field is null.

interval_precision cardinal_number

Applies to a feature not available in PostgreSQL (see datetime_precision for the fractional seconds precision of interval type attributes)

attribute_udt_catalog sql_identifier

Name of the database that the attribute data type is defined in (always the current database)

attribute_udt_schema sql_identifier

Name of the schema that the attribute data type is defined in

attribute_udt_name sql_identifier

Name of the attribute data type

scope_catalog sql_identifier

Applies to a feature not available in PostgreSQL

scope_schema sql_identifier

Applies to a feature not available in PostgreSQL

scope_name sql_identifier

Applies to a feature not available in PostgreSQL

maximum_cardinality cardinal_number

Always null, because arrays always have unlimited maximum cardinality in PostgreSQL

dtd_identifier sql_identifier

An identifier of the data type descriptor of the attribute, unique among the data type descriptors pertaining to the composite type. This is mainly useful for joining with other instances of such identifiers. (The specific format of the identifier is not defined and not guaranteed to remain the same in future versions.)

is_derived_reference_attribute yes_or_no

Applies to a feature not available in PostgreSQL

See also under Section 35.17, a similarly structured view, for further information on some of the columns.

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

## 35.60. user_defined_types #


**URL:** https://www.postgresql.org/docs/18/infoschema-user-defined-types.html

**Contents:**
- 35.60. user_defined_types #

The view user_defined_types currently contains all composite types defined in the current database. Only those types are shown that the current user has access to (by way of being the owner or having some privilege).

SQL knows about two kinds of user-defined types: structured types (also known as composite types in PostgreSQL) and distinct types (not implemented in PostgreSQL). To be future-proof, use the column user_defined_type_category to differentiate between these. Other user-defined types such as base types and enums, which are PostgreSQL extensions, are not shown here. For domains, see Section 35.23 instead.

Table 35.58. user_defined_types Columns

user_defined_type_catalog sql_identifier

Name of the database that contains the type (always the current database)

user_defined_type_schema sql_identifier

Name of the schema that contains the type

user_defined_type_name sql_identifier

user_defined_type_category character_data

Currently always STRUCTURED

is_instantiable yes_or_no

Applies to a feature not available in PostgreSQL

Applies to a feature not available in PostgreSQL

ordering_form character_data

Applies to a feature not available in PostgreSQL

ordering_category character_data

Applies to a feature not available in PostgreSQL

ordering_routine_catalog sql_identifier

Applies to a feature not available in PostgreSQL

ordering_routine_schema sql_identifier

Applies to a feature not available in PostgreSQL

ordering_routine_name sql_identifier

Applies to a feature not available in PostgreSQL

reference_type character_data

Applies to a feature not available in PostgreSQL

data_type character_data

Applies to a feature not available in PostgreSQL

character_maximum_length cardinal_number

Applies to a feature not available in PostgreSQL

character_octet_length cardinal_number

Applies to a feature not available in PostgreSQL

character_set_catalog sql_identifier

Applies to a feature not available in PostgreSQL

character_set_schema sql_identifier

Applies to a feature not available in PostgreSQL

character_set_name sql_identifier

Applies to a feature not available in PostgreSQL

collation_catalog sql_identifier

Applies to a feature not available in PostgreSQL

collation_schema sql_identifier

Applies to a feature not available in PostgreSQL

collation_name sql_identifier

Applies to a feature not available in PostgreSQL

numeric_precision cardinal_number

Applies to a feature not available in PostgreSQL

numeric_precision_radix cardinal_number

Applies to a feature not available in PostgreSQL

numeric_scale cardinal_number

Applies to a feature not available in PostgreSQL

datetime_precision cardinal_number

Applies to a feature not available in PostgreSQL

interval_type character_data

Applies to a feature not available in PostgreSQL

interval_precision cardinal_number

Applies to a feature not available in PostgreSQL

source_dtd_identifier sql_identifier

Applies to a feature not available in PostgreSQL

ref_dtd_identifier sql_identifier

Applies to a feature not available in PostgreSQL

**Examples:**

Example 1 (unknown):
```unknown
user_defined_types
```

Example 2 (unknown):
```unknown
user_defined_types
```

Example 3 (unknown):
```unknown
user_defined_types
```

Example 4 (unknown):
```unknown
user_defined_type_category
```

---


---

## 35.26. foreign_data_wrapper_options #


**URL:** https://www.postgresql.org/docs/18/infoschema-foreign-data-wrapper-options.html

**Contents:**
- 35.26. foreign_data_wrapper_options #

The view foreign_data_wrapper_options contains all the options defined for foreign-data wrappers in the current database. Only those foreign-data wrappers are shown that the current user has access to (by way of being the owner or having some privilege).

Table 35.24. foreign_data_wrapper_options Columns

foreign_data_wrapper_catalog sql_identifier

Name of the database that the foreign-data wrapper is defined in (always the current database)

foreign_data_wrapper_name sql_identifier

Name of the foreign-data wrapper

option_name sql_identifier

option_value character_data

**Examples:**

Example 1 (unknown):
```unknown
foreign_data_wrapper_options
```

Example 2 (unknown):
```unknown
foreign_data_wrapper_options
```

Example 3 (unknown):
```unknown
foreign_data_wrapper_options
```

Example 4 (unknown):
```unknown
foreign_data_wrapper_options
```

---


---

