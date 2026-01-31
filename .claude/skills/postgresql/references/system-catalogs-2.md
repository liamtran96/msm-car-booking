# PostgreSQL - System Catalogs (Part 2)

## 52.16. pg_db_role_setting #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-db-role-setting.html

**Contents:**
- 52.16. pg_db_role_setting #

The catalog pg_db_role_setting records the default values that have been set for run-time configuration variables, for each role and database combination.

Unlike most system catalogs, pg_db_role_setting is shared across all databases of a cluster: there is only one copy of pg_db_role_setting per cluster, not one per database.

Table 52.16. pg_db_role_setting Columns

setdatabase oid (references pg_database.oid)

The OID of the database the setting is applicable to, or zero if not database-specific

setrole oid (references pg_authid.oid)

The OID of the role the setting is applicable to, or zero if not role-specific

Defaults for run-time configuration variables

**Examples:**

Example 1 (unknown):
```unknown
pg_db_role_setting
```

Example 2 (unknown):
```unknown
pg_db_role_setting
```

Example 3 (unknown):
```unknown
pg_db_role_setting
```

Example 4 (unknown):
```unknown
pg_db_role_setting
```

---


---

## 52.65. pg_user_mapping #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-user-mapping.html

**Contents:**
- 52.65. pg_user_mapping #

The catalog pg_user_mapping stores the mappings from local user to remote. Access to this catalog is restricted from normal users, use the view pg_user_mappings instead.

Table 52.66. pg_user_mapping Columns

umuser oid (references pg_authid.oid)

OID of the local role being mapped, or zero if the user mapping is public

umserver oid (references pg_foreign_server.oid)

The OID of the foreign server that contains this mapping

User mapping specific options, as “keyword=value” strings

**Examples:**

Example 1 (unknown):
```unknown
pg_user_mapping
```

Example 2 (unknown):
```unknown
pg_user_mapping
```

Example 3 (unknown):
```unknown
pg_user_mapping
```

Example 4 (unknown):
```unknown
pg_user_mappings
```

---


---

## 52.63. pg_ts_template #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-ts-template.html

**Contents:**
- 52.63. pg_ts_template #

The pg_ts_template catalog contains entries defining text search templates. A template is the implementation skeleton for a class of text search dictionaries. Since a template must be implemented by C-language-level functions, creation of new templates is restricted to database superusers.

PostgreSQL's text search features are described at length in Chapter 12.

Table 52.63. pg_ts_template Columns

Text search template name

tmplnamespace oid (references pg_namespace.oid)

The OID of the namespace that contains this template

tmplinit regproc (references pg_proc.oid)

OID of the template's initialization function (zero if none)

tmpllexize regproc (references pg_proc.oid)

OID of the template's lexize function

**Examples:**

Example 1 (unknown):
```unknown
pg_ts_template
```

Example 2 (unknown):
```unknown
pg_ts_template
```

Example 3 (unknown):
```unknown
pg_ts_template
```

Example 4 (unknown):
```unknown
pg_ts_template
```

---


---

## 52.62. pg_ts_parser #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-ts-parser.html

**Contents:**
- 52.62. pg_ts_parser #

The pg_ts_parser catalog contains entries defining text search parsers. A parser is responsible for splitting input text into lexemes and assigning a token type to each lexeme. Since a parser must be implemented by C-language-level functions, creation of new parsers is restricted to database superusers.

PostgreSQL's text search features are described at length in Chapter 12.

Table 52.62. pg_ts_parser Columns

Text search parser name

prsnamespace oid (references pg_namespace.oid)

The OID of the namespace that contains this parser

prsstart regproc (references pg_proc.oid)

OID of the parser's startup function

prstoken regproc (references pg_proc.oid)

OID of the parser's next-token function

prsend regproc (references pg_proc.oid)

OID of the parser's shutdown function

prsheadline regproc (references pg_proc.oid)

OID of the parser's headline function (zero if none)

prslextype regproc (references pg_proc.oid)

OID of the parser's lextype function

**Examples:**

Example 1 (unknown):
```unknown
pg_ts_parser
```

Example 2 (unknown):
```unknown
pg_ts_parser
```

Example 3 (unknown):
```unknown
pg_ts_parser
```

Example 4 (unknown):
```unknown
pg_ts_parser
```

---


---

## 52.10. pg_cast #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-cast.html

**Contents:**
- 52.10. pg_cast #

The catalog pg_cast stores data type conversion paths, both built-in and user-defined.

It should be noted that pg_cast does not represent every type conversion that the system knows how to perform; only those that cannot be deduced from some generic rule. For example, casting between a domain and its base type is not explicitly represented in pg_cast. Another important exception is that “automatic I/O conversion casts”, those performed using a data type's own I/O functions to convert to or from text or other string types, are not explicitly represented in pg_cast.

Table 52.10. pg_cast Columns

castsource oid (references pg_type.oid)

OID of the source data type

casttarget oid (references pg_type.oid)

OID of the target data type

castfunc oid (references pg_proc.oid)

The OID of the function to use to perform this cast. Zero is stored if the cast method doesn't require a function.

Indicates what contexts the cast can be invoked in. e means only as an explicit cast (using CAST or :: syntax). a means implicitly in assignment to a target column, as well as explicitly. i means implicitly in expressions, as well as the other cases.

Indicates how the cast is performed. f means that the function specified in the castfunc field is used. i means that the input/output functions are used. b means that the types are binary-coercible, thus no conversion is required.

The cast functions listed in pg_cast must always take the cast source type as their first argument type, and return the cast destination type as their result type. A cast function can have up to three arguments. The second argument, if present, must be type integer; it receives the type modifier associated with the destination type, or -1 if there is none. The third argument, if present, must be type boolean; it receives true if the cast is an explicit cast, false otherwise.

It is legitimate to create a pg_cast entry in which the source and target types are the same, if the associated function takes more than one argument. Such entries represent “length coercion functions” that coerce values of the type to be legal for a particular type modifier value.

When a pg_cast entry has different source and target types and a function that takes more than one argument, it represents converting from one type to another and applying a length coercion in a single step. When no such entry is available, coercion to a type that uses a type modifier involves two steps, one to convert between data types and a second to apply the modifier.

**Examples:**

Example 1 (unknown):
```unknown
castcontext
```

Example 2 (unknown):
```unknown
pg_auth_members
```

---


---

## 52.17. pg_default_acl #


**URL:** https://www.postgresql.org/docs/18/catalog-pg-default-acl.html

**Contents:**
- 52.17. pg_default_acl #

The catalog pg_default_acl stores initial privileges to be assigned to newly created objects.

Table 52.17. pg_default_acl Columns

defaclrole oid (references pg_authid.oid)

The OID of the role associated with this entry

defaclnamespace oid (references pg_namespace.oid)

The OID of the namespace associated with this entry, or zero if none

Type of object this entry is for: r = relation (table, view), S = sequence, f = function, T = type, n = schema, L = large object

Access privileges that this type of object should have on creation

A pg_default_acl entry shows the initial privileges to be assigned to an object belonging to the indicated user. There are currently two types of entry: “global” entries with defaclnamespace = zero, and “per-schema” entries that reference a particular schema. If a global entry is present then it overrides the normal hard-wired default privileges for the object type. A per-schema entry, if present, represents privileges to be added to the global or hard-wired default privileges.

Note that when an ACL entry in another catalog is null, it is taken to represent the hard-wired default privileges for its object, not whatever might be in pg_default_acl at the moment. pg_default_acl is only consulted during object creation.

**Examples:**

Example 1 (unknown):
```unknown
pg_default_acl
```

Example 2 (unknown):
```unknown
pg_default_acl
```

Example 3 (unknown):
```unknown
pg_default_acl
```

Example 4 (unknown):
```unknown
pg_default_acl
```

---


---

