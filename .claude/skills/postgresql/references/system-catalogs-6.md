# PostgreSQL - System Catalogs (Part 6)

## 52.46. pg_seclabel #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-seclabel.html

**Contents:**
- 52.46. pg_seclabel #

The catalog pg_seclabel stores security labels on database objects. Security labels can be manipulated with the SECURITY LABEL command. For an easier way to view security labels, see Section 53.23.

See also pg_shseclabel, which performs a similar function for security labels of database objects that are shared across a database cluster.

Table 52.46. pg_seclabel Columns

objoid oid (references any OID column)

The OID of the object this security label pertains to

classoid oid (references pg_class.oid)

The OID of the system catalog this object appears in

For a security label on a table column, this is the column number (the objoid and classoid refer to the table itself). For all other object types, this column is zero.

The label provider associated with this label.

The security label applied to this object.

**Examples:**

Example 1 (unknown):
```unknown
pg_seclabel
```

Example 2 (unknown):
```unknown
pg_seclabel
```

Example 3 (unknown):
```unknown
pg_seclabel
```

Example 4 (unknown):
```unknown
SECURITY LABEL
```

---


---

## 52.59. pg_ts_config #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-ts-config.html

**Contents:**
- 52.59. pg_ts_config #

The pg_ts_config catalog contains entries representing text search configurations. A configuration specifies a particular text search parser and a list of dictionaries to use for each of the parser's output token types. The parser is shown in the pg_ts_config entry, but the token-to-dictionary mapping is defined by subsidiary entries in pg_ts_config_map.

PostgreSQL's text search features are described at length in Chapter 12.

Table 52.59. pg_ts_config Columns

Text search configuration name

cfgnamespace oid (references pg_namespace.oid)

The OID of the namespace that contains this configuration

cfgowner oid (references pg_authid.oid)

Owner of the configuration

cfgparser oid (references pg_ts_parser.oid)

The OID of the text search parser for this configuration

**Examples:**

Example 1 (unknown):
```unknown
pg_ts_config
```

Example 2 (unknown):
```unknown
pg_ts_config
```

Example 3 (unknown):
```unknown
pg_ts_config
```

Example 4 (unknown):
```unknown
pg_ts_config
```

---


---

## 52.64. pg_type #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-type.html

**Contents:**
- 52.64. pg_type #
  - Note

The catalog pg_type stores information about data types. Base types and enum types (scalar types) are created with CREATE TYPE, and domains with CREATE DOMAIN. A composite type is automatically created for each table in the database, to represent the row structure of the table. It is also possible to create composite types with CREATE TYPE AS.

Table 52.64. pg_type Columns

typnamespace oid (references pg_namespace.oid)

The OID of the namespace that contains this type

typowner oid (references pg_authid.oid)

For a fixed-size type, typlen is the number of bytes in the internal representation of the type. But for a variable-length type, typlen is negative. -1 indicates a “varlena” type (one that has a length word), -2 indicates a null-terminated C string.

typbyval determines whether internal routines pass a value of this type by value or by reference. typbyval had better be false if typlen is not 1, 2, or 4 (or 8 on machines where Datum is 8 bytes). Variable-length types are always passed by reference. Note that typbyval can be false even if the length would allow pass-by-value.

typtype is b for a base type, c for a composite type (e.g., a table's row type), d for a domain, e for an enum type, p for a pseudo-type, r for a range type, or m for a multirange type. See also typrelid and typbasetype.

typcategory is an arbitrary classification of data types that is used by the parser to determine which implicit casts should be “preferred”. See Table 52.65.

True if the type is a preferred cast target within its typcategory

True if the type is defined, false if this is a placeholder entry for a not-yet-defined type. When typisdefined is false, nothing except the type name, namespace, and OID can be relied on.

Character that separates two values of this type when parsing array input. Note that the delimiter is associated with the array element data type, not the array data type.

typrelid oid (references pg_class.oid)

If this is a composite type (see typtype), then this column points to the pg_class entry that defines the corresponding table. (For a free-standing composite type, the pg_class entry doesn't really represent a table, but it is needed anyway for the type's pg_attribute entries to link to.) Zero for non-composite types.

typsubscript regproc (references pg_proc.oid)

Subscripting handler function's OID, or zero if this type doesn't support subscripting. Types that are “true” array types have typsubscript = array_subscript_handler, but other types may have other handler functions to implement specialized subscripting behavior.

typelem oid (references pg_type.oid)

If typelem is not zero then it identifies another row in pg_type, defining the type yielded by subscripting. This should be zero if typsubscript is zero. However, it can be zero when typsubscript isn't zero, if the handler doesn't need typelem to determine the subscripting result type. Note that a typelem dependency is considered to imply physical containment of the element type in this type; so DDL changes on the element type might be restricted by the presence of this type.

typarray oid (references pg_type.oid)

If typarray is not zero then it identifies another row in pg_type, which is the “true” array type having this type as element

typinput regproc (references pg_proc.oid)

Input conversion function (text format)

typoutput regproc (references pg_proc.oid)

Output conversion function (text format)

typreceive regproc (references pg_proc.oid)

Input conversion function (binary format), or zero if none

typsend regproc (references pg_proc.oid)

Output conversion function (binary format), or zero if none

typmodin regproc (references pg_proc.oid)

Type modifier input function, or zero if type does not support modifiers

typmodout regproc (references pg_proc.oid)

Type modifier output function, or zero to use the standard format

typanalyze regproc (references pg_proc.oid)

Custom ANALYZE function, or zero to use the standard function

typalign is the alignment required when storing a value of this type. It applies to storage on disk as well as most representations of the value inside PostgreSQL. When multiple values are stored consecutively, such as in the representation of a complete row on disk, padding is inserted before a datum of this type so that it begins on the specified boundary. The alignment reference is the beginning of the first datum in the sequence. Possible values are:

c = char alignment, i.e., no alignment needed.

s = short alignment (2 bytes on most machines).

i = int alignment (4 bytes on most machines).

d = double alignment (8 bytes on many machines, but by no means all).

typstorage tells for varlena types (those with typlen = -1) if the type is prepared for toasting and what the default strategy for attributes of this type should be. Possible values are:

p (plain): Values must always be stored plain (non-varlena types always use this value).

e (external): Values can be stored in a secondary “TOAST” relation (if relation has one, see pg_class.reltoastrelid).

m (main): Values can be compressed and stored inline.

x (extended): Values can be compressed and/or moved to a secondary relation.

x is the usual choice for toast-able types. Note that m values can also be moved out to secondary storage, but only as a last resort (e and x values are moved first).

typnotnull represents a not-null constraint on a type. Used for domains only.

typbasetype oid (references pg_type.oid)

If this is a domain (see typtype), then typbasetype identifies the type that this one is based on. Zero if this type is not a domain.

Domains use typtypmod to record the typmod to be applied to their base type (-1 if base type does not use a typmod). -1 if this type is not a domain.

typndims is the number of array dimensions for a domain over an array (that is, typbasetype is an array type). Zero for types other than domains over array types.

typcollation oid (references pg_collation.oid)

typcollation specifies the collation of the type. If the type does not support collations, this will be zero. A base type that supports collations will have a nonzero value here, typically DEFAULT_COLLATION_OID. A domain over a collatable type can have a collation OID different from its base type's, if one was specified for the domain.

typdefaultbin pg_node_tree

If typdefaultbin is not null, it is the nodeToString() representation of a default expression for the type. This is only used for domains.

typdefault is null if the type has no associated default value. If typdefaultbin is not null, typdefault must contain a human-readable version of the default expression represented by typdefaultbin. If typdefaultbin is null and typdefault is not, then typdefault is the external representation of the type's default value, which can be fed to the type's input converter to produce a constant.

Access privileges; see Section 5.8 for details

For fixed-width types used in system tables, it is critical that the size and alignment defined in pg_type agree with the way that the compiler will lay out the column in a structure representing a table row.

Table 52.65 lists the system-defined values of typcategory. Any future additions to this list will also be upper-case ASCII letters. All other ASCII characters are reserved for user-defined categories.

Table 52.65. typcategory Codes

**Examples:**

Example 1 (unknown):
```unknown
CREATE TYPE
```

Example 2 (unknown):
```unknown
CREATE DOMAIN
```

Example 3 (unknown):
```unknown
CREATE TYPE AS
```

Example 4 (unknown):
```unknown
typnamespace
```

---


---

## 52.48. pg_shdepend #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-shdepend.html

**Contents:**
- 52.48. pg_shdepend #

The catalog pg_shdepend records the dependency relationships between database objects and shared objects, such as roles. This information allows PostgreSQL to ensure that those objects are unreferenced before attempting to delete them.

See also pg_depend, which performs a similar function for dependencies involving objects within a single database.

Unlike most system catalogs, pg_shdepend is shared across all databases of a cluster: there is only one copy of pg_shdepend per cluster, not one per database.

Table 52.48. pg_shdepend Columns

dbid oid (references pg_database.oid)

The OID of the database the dependent object is in, or zero for a shared object

classid oid (references pg_class.oid)

The OID of the system catalog the dependent object is in

objid oid (references any OID column)

The OID of the specific dependent object

For a table column, this is the column number (the objid and classid refer to the table itself). For all other object types, this column is zero.

refclassid oid (references pg_class.oid)

The OID of the system catalog the referenced object is in (must be a shared catalog)

refobjid oid (references any OID column)

The OID of the specific referenced object

A code defining the specific semantics of this dependency relationship; see text

In all cases, a pg_shdepend entry indicates that the referenced object cannot be dropped without also dropping the dependent object. However, there are several subflavors identified by deptype:

The referenced object (which must be a role) is the owner of the dependent object.

The referenced object (which must be a role) is mentioned in the ACL of the dependent object. (A SHARED_DEPENDENCY_ACL entry is not made for the owner of the object, since the owner will have a SHARED_DEPENDENCY_OWNER entry anyway.)

The referenced object (which must be a role) is mentioned in a pg_init_privs entry for the dependent object.

The referenced object (which must be a role) is mentioned as the target of a dependent policy object.

The referenced object (which must be a tablespace) is mentioned as the tablespace for a relation that doesn't have storage.

Other dependency flavors might be needed in future. Note in particular that the current definition only supports roles and tablespaces as referenced objects.

As in the pg_depend catalog, most objects created during initdb are considered “pinned”. No entries are made in pg_shdepend that would have a pinned object as either referenced or dependent object.

**Examples:**

Example 1 (unknown):
```unknown
pg_shdepend
```

Example 2 (unknown):
```unknown
pg_shdepend
```

Example 3 (unknown):
```unknown
pg_shdepend
```

Example 4 (unknown):
```unknown
pg_shdepend
```

---


---

